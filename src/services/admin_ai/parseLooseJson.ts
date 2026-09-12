/**
 * Best-effort JSON object out of a model's raw text.
 *
 * JSON mode returns a bare object; the plain-text retry used when every
 * provider in the chain refuses `response_format` may still fence it, or
 * wrap it in a sentence. All three are tried in that order, and nothing
 * throws — prose that isn't JSON at all gets `null`, which callers treat as
 * "not a structured reply" rather than an error.
 */
export function parseLooseJsonObject(raw: string): Record<string, unknown> | null {
  const tryParse = (text: string | undefined): Record<string, unknown> | null => {
    if (!text) return null;
    try {
      const value: unknown = JSON.parse(text);
      return value && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  };

  const trimmed = raw.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const firstBrace = trimmed.indexOf("{");
  return (
    tryParse(trimmed) ??
    tryParse(fence?.[1]?.trim()) ??
    (firstBrace >= 0
      ? tryParse(trimmed.slice(firstBrace, trimmed.lastIndexOf("}") + 1))
      : null)
  );
}
