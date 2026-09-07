export function formatClinicalNoteHeading(value: string) {
  const date = new Date(value).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return `${date} – Clinical Note`;
}
