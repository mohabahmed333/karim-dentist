export const TALES_TAGLINE = "The Tales We Hold Within";

export function talesTaglineLines(): string[] {
  return ["The Tales", "We Hold Within"];
}

export function thinkDesignTaglineLines(): string[] {
  return ["Think. Design.", "Develop. Launch.", "Repeat."];
}

function splitWordsIntoLines(text: string, lineCount: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];
  if (words.length <= lineCount) return words;

  const lines: string[] = [];
  let index = 0;
  for (let i = 0; i < lineCount; i += 1) {
    const remainingLines = lineCount - i;
    const remainingWords = words.length - index;
    const take = Math.ceil(remainingWords / remainingLines);
    lines.push(words.slice(index, index + take).join(" "));
    index += take;
  }
  return lines;
}

export function footerTaglineLines(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [""];

  if (trimmed.includes("\n")) {
    return trimmed
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  const normalized = trimmed.replace(/\s+/g, " ");
  if (normalized === TALES_TAGLINE) return talesTaglineLines();
  if (normalized === "Think. Design. Develop. Launch. Repeat.") {
    return thinkDesignTaglineLines();
  }

  if (normalized.includes(". ")) {
    const parts = normalized
      .split(/\.\s+/)
      .map((part) => part.replace(/\.$/, "").trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      return parts.map((part, index) =>
        index < parts.length - 1 || normalized.endsWith(".")
          ? `${part}.`
          : part,
      );
    }
  }

  return splitWordsIntoLines(normalized, 2);
}
