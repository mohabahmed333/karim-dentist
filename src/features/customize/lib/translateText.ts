export type TranslateSource = "ar" | "en";

export async function translateText(
  text: string,
  source: TranslateSource,
  signal?: AbortSignal,
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return "";

  const response = await fetch("/api/v1/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ text: trimmed, source }),
    signal,
  });

  const payload = (await response.json()) as {
    translatedText?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error || "Translation failed");
  }

  return (payload.translatedText ?? "").trim();
}
