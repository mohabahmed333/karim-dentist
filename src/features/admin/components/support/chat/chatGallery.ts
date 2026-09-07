import type { MediaImageItem } from "./collectConversationMedia";

export function indexOfGalleryImage(
  images: Pick<MediaImageItem, "url">[],
  url: string,
): number {
  return images.findIndex((item) => item.url === url);
}
