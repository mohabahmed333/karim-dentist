import type { AnyMessageKey } from "@/lib/i18n";

export type ChatResourceKind = "photo" | "xray" | "cbct" | "image" | "file";

export type ChatResourceStatus = "ready" | "uploading" | "error";

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

const KIND_KEYS: Record<ChatResourceKind, AnyMessageKey> = {
  xray: "admin.chat.resource.xray",
  cbct: "admin.chat.resource.cbct",
  photo: "admin.chat.resource.photo",
  image: "admin.chat.resource.image",
  file: "admin.chat.resource.file",
};

export function chatResourceLabel(
  kind: ChatResourceKind,
  t?: (key: AnyMessageKey) => string,
): string {
  const key = KIND_KEYS[kind];
  if (t) return t(key);
  switch (kind) {
    case "xray":
      return "X-ray";
    case "cbct":
      return "CBCT";
    case "photo":
      return "Photo";
    case "image":
      return "Image";
    case "file":
      return "File";
  }
}
