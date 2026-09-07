const SECTION_FIELD_PREFIX = "section-";

const UUID =
  "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

const SECTION_BLOCK_ID_RE = new RegExp(
  `^${SECTION_FIELD_PREFIX}(temp-${UUID}|${UUID})`,
  "i",
);

export function parseSectionBlockIdFromField(
  field: string | null | undefined,
): string | null {
  if (!field?.startsWith(SECTION_FIELD_PREFIX)) return null;
  const match = field.match(SECTION_BLOCK_ID_RE);
  return match?.[1] ?? null;
}
