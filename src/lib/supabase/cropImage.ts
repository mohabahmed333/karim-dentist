import { fileExtension } from "./uploadHelpers";

export type PixelCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function shouldCropImage(file: File): boolean {
  const ext = fileExtension(file.name);
  if (ext === "svg" || ext === "gif") return false;
  const type = file.type.toLowerCase();
  if (type === "image/svg+xml" || type === "image/gif") return false;
  return type.startsWith("image/") || ["png", "jpg", "jpeg", "webp"].includes(ext);
}

function outputMime(file: File): { type: string; ext: string } {
  const type = file.type.toLowerCase();
  if (type === "image/png" || fileExtension(file.name) === "png") {
    return { type: "image/png", ext: "png" };
  }
  if (type === "image/webp" || fileExtension(file.name) === "webp") {
    return { type: "image/webp", ext: "webp" };
  }
  return { type: "image/jpeg", ext: "jpg" };
}

export async function cropImageFile(
  file: File,
  crop: PixelCrop,
): Promise<File> {
  if (crop.width < 1 || crop.height < 1) {
    throw new Error("Crop area is empty.");
  }
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(crop.width);
    canvas.height = Math.round(crop.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not crop image.");
    ctx.drawImage(
      bitmap,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    const { type, ext } = outputMime(file);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Could not crop image."))),
        type,
        type === "image/jpeg" ? 0.92 : undefined,
      );
    });
    const base = file.name.replace(/\.[^.]+$/, "") || "crop";
    return new File([blob], `${base}-crop.${ext}`, {
      type,
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}
