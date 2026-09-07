export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function withSlugSuffix(base: string, suffix: number): string {
  return suffix <= 1 ? base : `${base}-${suffix}`;
}
