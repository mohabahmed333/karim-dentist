import type { SupportMessage } from "../supportDummyData";

export type MediaImageItem = {
  id: string;
  url: string;
  name?: string;
};

export type MediaAttachmentItem = {
  id: string;
  url: string;
  name: string;
  mime?: string;
  size?: number;
  kind: "document" | "video" | "audio";
};

export type MediaLinkItem = {
  id: string;
  url: string;
  label: string;
};

const URL_RE = /https?:\/\/[^\s<>"')\]]+/gi;

function isImageMime(mime?: string, type?: string) {
  return (
    (mime ?? "").startsWith("image/") ||
    type === "image" ||
    type === "sticker"
  );
}

function isVideoMime(mime?: string, type?: string) {
  return (mime ?? "").startsWith("video/") || type === "video";
}

function isAudioMime(mime?: string, type?: string) {
  return (
    (mime ?? "").startsWith("audio/") || type === "audio" || type === "voice"
  );
}

function isDocMime(mime?: string, type?: string) {
  return type === "document" || (mime ?? "").includes("pdf");
}

export function collectConversationMedia(messages: SupportMessage[]) {
  const images: MediaImageItem[] = [];
  const attachments: MediaAttachmentItem[] = [];
  const links: MediaLinkItem[] = [];
  const seenLinks = new Set<string>();

  for (const m of messages) {
    const type = (m.messageType ?? "").toLowerCase();
    for (const item of m.media ?? []) {
      if (!item.url) continue;
      if (isImageMime(item.mime, type)) {
        images.push({
          id: `${m.id}-img-${images.length}`,
          url: item.url,
          name: item.name,
        });
      } else if (isDocMime(item.mime, type)) {
        attachments.push({
          id: `${m.id}-doc-${attachments.length}`,
          url: item.url,
          name: item.name || "Document",
          mime: item.mime,
          size: item.size,
          kind: "document",
        });
      } else if (isVideoMime(item.mime, type)) {
        attachments.push({
          id: `${m.id}-vid-${attachments.length}`,
          url: item.url,
          name: item.name || "Video",
          mime: item.mime,
          size: item.size,
          kind: "video",
        });
      } else if (isAudioMime(item.mime, type)) {
        attachments.push({
          id: `${m.id}-aud-${attachments.length}`,
          url: item.url,
          name: item.name || "Audio",
          mime: item.mime,
          size: item.size,
          kind: "audio",
        });
      }
    }

    const body = m.body ?? "";
    const found = body.match(URL_RE) ?? [];
    for (const raw of found) {
      const url = raw.replace(/[.,;:!?)]+$/, "");
      if (seenLinks.has(url)) continue;
      seenLinks.add(url);
      let label = url;
      try {
        label = new URL(url).hostname.replace(/^www\./, "");
      } catch {
        /* keep raw */
      }
      links.push({ id: `${m.id}-link-${links.length}`, url, label });
    }

    if (m.flow?.kind === "cta" && m.flow.ctaUrl) {
      const url = m.flow.ctaUrl;
      if (!seenLinks.has(url)) {
        seenLinks.add(url);
        links.push({
          id: `${m.id}-cta`,
          url,
          label: m.flow.ctaLabel || "Link",
        });
      }
    }
  }

  return { images, attachments, links };
}
