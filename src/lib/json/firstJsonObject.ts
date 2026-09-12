/**
 * Pull the first balanced `{...}` out of a model's answer.
 *
 * Asking for JSON mode is not the same as getting it: providers differ in
 * whether they honour `response_format`, and a model that ignores it wraps the
 * object in prose or a ```json fence. Counting braces — while respecting
 * strings and escapes, so a `{` inside a reply is text rather than structure —
 * reads all of those the same way.
 *
 * Returns null when nothing is balanced, which the caller should treat as "the
 * model gave me nothing usable" rather than as an empty object.
 */
export function firstJsonObject(raw: string): string | null {
  const start = raw.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < raw.length; i += 1) {
    const ch = raw[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return raw.slice(start, i + 1);
    }
  }
  return null;
}
