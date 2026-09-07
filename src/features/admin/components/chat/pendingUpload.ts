import { inferChatResourceKind, type ChatResourceKind } from "./resourceKinds";

export type PendingChatUpload = {
  id: string;
  file: File;
  previewUrl: string;
  kind: ChatResourceKind;
};

export function createPendingUploads(
  list: FileList | File[],
): PendingChatUpload[] {
  return [...list].map((file) => ({
    id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
    file,
    previewUrl: URL.createObjectURL(file),
    kind: inferChatResourceKind(file),
  }));
}

export function revokePendingUploads(items: PendingChatUpload[]) {
  for (const item of items) URL.revokeObjectURL(item.previewUrl);
}
