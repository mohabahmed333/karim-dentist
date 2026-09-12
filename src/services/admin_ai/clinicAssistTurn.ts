import { parseLooseJsonObject } from "./parseLooseJson";
import { extractClinicChatPayload, type ClinicChatPayload } from "./extractClinicChat";
import { runTool as runToolDefault, type ToolResult } from "./tools/registry";
import type { ToolDb } from "./tools/types";

export type TurnMessage = { role: "system" | "user" | "assistant"; content: string };

export type ToolCallLogEntry = { name: string; args: unknown; ok: boolean };

export type ClinicAssistTurnResult = ClinicChatPayload & { toolCalls: ToolCallLogEntry[] };

const MAX_TOOL_STEPS = 3;

function asToolCall(raw: string): { name: string; args: unknown } | null {
  const obj = parseLooseJsonObject(raw);
  const call = obj?.toolCall;
  if (!call || typeof call !== "object" || Array.isArray(call)) return null;
  const name = (call as Record<string, unknown>).name;
  if (typeof name !== "string" || !name) return null;
  return { name, args: (call as Record<string, unknown>).args ?? {} };
}

/**
 * One Clinic Assist reply, with up to `maxSteps` tool round-trips.
 *
 * `ai_chat`'s provider chain has no notion of a mid-conversation tool call —
 * and no way to keep asking the *same* model across a multi-step tool loop,
 * since a fresh `aiChat()` call may land on a different provider each time.
 * So the loop lives here instead, at the text level: a tool call is just JSON
 * the model was asked to emit, recognised before the turn is treated as a
 * normal reply. That works identically regardless of which provider answers
 * any given step.
 */
export async function runClinicAssistTurn(input: {
  db: ToolDb;
  system: string;
  messages: TurnMessage[];
  complete: (messages: TurnMessage[]) => Promise<string>;
  maxSteps?: number;
  /** Injectable for tests; defaults to the real tool registry. */
  runTool?: (db: ToolDb, name: string, args: unknown) => Promise<ToolResult>;
}): Promise<ClinicAssistTurnResult> {
  const maxSteps = input.maxSteps ?? MAX_TOOL_STEPS;
  const runTool = input.runTool ?? runToolDefault;
  let convo = [...input.messages];
  const toolCalls: ToolCallLogEntry[] = [];

  for (let step = 0; step < maxSteps; step += 1) {
    const raw = await input.complete([{ role: "system", content: input.system }, ...convo]);
    const call = asToolCall(raw);
    if (!call) return { ...extractClinicChatPayload(raw), toolCalls };

    const result = await runTool(input.db, call.name, call.args);
    toolCalls.push({ name: call.name, args: call.args, ok: result.ok });
    convo = [
      ...convo,
      { role: "assistant", content: raw },
      {
        role: "user",
        content: JSON.stringify(
          result.ok
            ? { toolResult: { name: call.name, data: result.data } }
            : { toolError: result.error },
        ),
      },
    ];
  }

  const finalSystem = `${input.system}\n\nYou have used all your tool calls for this turn — do not request another tool. Answer now from what you already have.`;
  const raw = await input.complete([{ role: "system", content: finalSystem }, ...convo]);
  return { ...extractClinicChatPayload(raw), toolCalls };
}
