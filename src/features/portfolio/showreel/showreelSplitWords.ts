/** Split hero text into words for a per-word reveal animation. */
export function splitShowreelWords(text: string): string[] {
  return text.split(/\s+/).filter((word) => word.length > 0);
}
