/** Split a stored headline so the accent word can render in italic serif. */
export function splitHeroAccent(
  headline: string,
  accent: string,
  accentWord: string,
): { before: string; accent: string; after: string } {
  if (accent.trim()) {
    return { before: headline, accent: accent.trim(), after: "" };
  }
  const word = accentWord.trim();
  if (!word) return { before: headline, accent: "", after: "" };
  const idx = headline.indexOf(word);
  if (idx < 0) return { before: headline, accent: "", after: "" };
  return {
    before: headline.slice(0, idx),
    accent: word,
    after: headline.slice(idx + word.length),
  };
}
