export function imageFileFromClipboard(
  data: DataTransfer | null | undefined,
): File | null {
  if (!data) return null;

  for (const item of Array.from(data.items)) {
    if (!item.type.startsWith("image/")) continue;
    const blob = item.getAsFile();
    if (!blob) continue;
    const ext = item.type.split("/")[1]?.split(";")[0] || "png";
    const name =
      blob.name && blob.name !== "image.png"
        ? blob.name
        : `screenshot-${Date.now()}.${ext}`;
    return new File([blob], name, {
      type: blob.type || item.type,
      lastModified: Date.now(),
    });
  }

  for (const file of Array.from(data.files)) {
    if (file.type.startsWith("image/")) return file;
  }

  return null;
}
