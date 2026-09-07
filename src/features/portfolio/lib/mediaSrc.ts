/** Non-empty media URL, or null when cleared / missing. */
export function mediaSrc(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
