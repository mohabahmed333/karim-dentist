/** Compare public media URLs ignoring query/hash and trailing slash. */
export function mediaUrlsMatch(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  try {
    const left = new URL(a, "https://example.invalid");
    const right = new URL(b, "https://example.invalid");
    const norm = (u: URL) =>
      `${u.origin}${u.pathname}`.replace(/\/+$/, "").toLowerCase();
    return norm(left) === norm(right);
  } catch {
    return a.replace(/[?#].*$/, "") === b.replace(/[?#].*$/, "");
  }
}
