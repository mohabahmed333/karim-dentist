export function clientDisplayMode(item: {
  name: string;
  logo_url?: string | null;
}): "image" | "text" {
  return String(item.logo_url ?? "").trim() ? "image" : "text";
}
