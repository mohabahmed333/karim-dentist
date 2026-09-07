export function featuredProjectPath(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return `/featured/${slug}`;
}
