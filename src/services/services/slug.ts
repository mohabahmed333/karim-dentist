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

export function isBlankSlug(slug: string | null | undefined): boolean {
  return !String(slug ?? "").trim();
}

type SlugTitle = { slug?: string | null; title?: string };

export function withEnsuredSlug(
  current: SlugTitle,
  partial: Record<string, unknown>,
): Record<string, unknown> {
  const title = String(partial.title ?? current.title ?? "");
  const nextSlug = (partial.slug === undefined ? current.slug : partial.slug) as
    | string
    | null
    | undefined;
  if (!isBlankSlug(nextSlug) || !title.trim()) return partial;
  return { ...partial, slug: slugifyTitle(title) || "untitled" };
}
