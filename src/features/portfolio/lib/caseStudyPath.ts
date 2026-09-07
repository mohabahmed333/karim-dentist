export function caseStudyPath(slug: string | null | undefined): string | null {
  if (!slug) return null;
  return `/case-studies/${slug}`;
}
