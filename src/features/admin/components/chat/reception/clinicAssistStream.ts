/**
 * Read the clinic-chat route's SSE response.
 *
 * A tool round-trip can take several seconds, so the route streams a
 * `status` event per tool call, then one `done` (or `error`) event with the
 * same payload the old single-JSON response used to return in one shot.
 */
export type ClinicAssistStreamEvent =
  | { type: "status"; text: string }
  | { type: "done"; payload: unknown }
  | { type: "error"; error: string };

function parseBlock(raw: string): ClinicAssistStreamEvent | null {
  let event = "message";
  let data = "";
  for (const line of raw.split("\n")) {
    if (line.startsWith("event:")) event = line.slice("event:".length).trim();
    else if (line.startsWith("data:")) data += line.slice("data:".length).trim();
  }
  if (!data) return null;

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(data) as Record<string, unknown>;
  } catch {
    return null;
  }

  if (event === "status") return { type: "status", text: String(parsed.text ?? "") };
  if (event === "done") return { type: "done", payload: parsed };
  if (event === "error") return { type: "error", error: String(parsed.error ?? "") };
  return null;
}

export async function readClinicAssistStream(
  response: Response,
  onEvent: (event: ClinicAssistStreamEvent) => void,
): Promise<void> {
  if (!response.body) throw new Error("Empty response stream");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf("\n\n");
    while (boundary >= 0) {
      const block = parseBlock(buffer.slice(0, boundary));
      if (block) onEvent(block);
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");
    }
  }
}
