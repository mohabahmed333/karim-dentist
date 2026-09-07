export const IMAGE_FILE_ACCEPT =
  "image/png,image/jpeg,image/webp,image/gif,image/svg+xml,.png,.jpg,.jpeg,.webp,.gif,.svg";

export const VIDEO_FILE_ACCEPT =
  "video/mp4,video/webm,video/quicktime,.mp4,.mov,.webm,.m4v";

export const ATTACHMENT_FILE_ACCEPT =
  `${IMAGE_FILE_ACCEPT},application/pdf,.pdf,application/msword,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx`;

const IMAGE_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
};

const VIDEO_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  m4v: "video/mp4",
};

export function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

export function inferMediaContentType(file: File): string | undefined {
  if (file.type) return file.type;
  const ext = fileExtension(file.name);
  return IMAGE_TYPES[ext] ?? VIDEO_TYPES[ext];
}

export function prepareMediaFile(file: File, kind: "image" | "video"): File {
  const ext = fileExtension(file.name);
  const heic =
    ext === "heic" ||
    ext === "heif" ||
    file.type === "image/heic" ||
    file.type === "image/heif";
  if (heic) {
    throw new Error(
      "Mac Photos HEIC files are not supported. Export as JPEG or PNG first.",
    );
  }
  const type = inferMediaContentType(file);
  if (kind === "image" && type && !type.startsWith("image/")) {
    throw new Error("Please choose a PNG, JPEG, WebP, GIF, or SVG image.");
  }
  if (kind === "video" && type && !type.startsWith("video/")) {
    throw new Error("Please choose an MP4, MOV, or WebM video.");
  }
  if (type && type !== file.type) {
    return new File([file], file.name, {
      type,
      lastModified: file.lastModified,
    });
  }
  return file;
}

export function mapStorageUploadError(error: { message: string }): Error {
  const message = error.message.toLowerCase();
  const denied =
    message.includes("row-level security") || message.includes("unauthorized");
  if (denied) {
    return new Error(
      "Upload requires an admin login. Sign in at /admin/login and try again.",
    );
  }
  return new Error(error.message);
}
