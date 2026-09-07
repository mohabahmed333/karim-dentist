export const CASE_STUDY_FIELDS = [
  "title",
  "description",
  "year",
  "category",
  "client",
  "director",
  "agency",
  "production_company",
  "tags",
  "media_url",
  "is_published",
] as const;

export type CaseStudyField = (typeof CASE_STUDY_FIELDS)[number];

export function isCaseStudyField(value: string): value is CaseStudyField {
  return (CASE_STUDY_FIELDS as readonly string[]).includes(value);
}

export const CASE_STUDY_FIELD_LABELS: Record<CaseStudyField, string> = {
  title: "Title",
  description: "Description",
  year: "Year",
  category: "Category",
  client: "Client",
  director: "Director",
  agency: "Agency",
  production_company: "Production company",
  tags: "Tags",
  media_url: "Card media",
  is_published: "Published",
};
