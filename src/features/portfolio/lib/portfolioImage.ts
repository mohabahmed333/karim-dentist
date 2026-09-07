const OPTIMIZER_WIDTH = 1200;
const OPTIMIZER_QUALITY = 75;

export function getPortfolioImageSrc(source: string, optimize = true): string {
  if (!optimize) return source;
  if (!source.startsWith("https://") && !source.startsWith("http://")) {
    return source;
  }

  const params = new URLSearchParams({
    url: source,
    w: String(OPTIMIZER_WIDTH),
    q: String(OPTIMIZER_QUALITY),
  });

  return `/_next/image?${params.toString()}`;
}
