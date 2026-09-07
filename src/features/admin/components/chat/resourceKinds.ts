export type ChatResourceKind = "photo" | "xray" | "cbct" | "image" | "file";

export function inferChatResourceKind(
  fileOrKind: File | string,
): ChatResourceKind {
  if (typeof fileOrKind === "string") {
    const k = fileOrKind.toLowerCase();
    if (k === "xray" || k === "cbct" || k === "photo") return k;
    if (k === "image" || k === "chat") return "image";
    if (k === "file") return "file";
    return "photo";
  }
  const name = fileOrKind.name.toLowerCase();
  const mime = fileOrKind.type.toLowerCase();
  if (name.includes("cbct") || name.includes("ct")) return "cbct";
  if (name.includes("xray") || name.includes("x-ray") || name.includes("radio")) {
    return "xray";
  }
  if (mime.startsWith("image/")) return "photo";
  return "file";
}
