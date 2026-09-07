import type { SupportMessage } from "../supportDummyData";

const IMAGE_GROUP_MS = 90_000;

function isImageMessage(m: SupportMessage): boolean {
  if ((m.messageType ?? "").toLowerCase() === "image") return true;
  return (m.media ?? []).some(
    (item) =>
      (item.mime ?? "").startsWith("image/") ||
      /\.(jpe?g|png|gif|webp)(\?|$)/i.test(item.url),
  );
}

function tsMs(m: SupportMessage): number {
  if (!m.waTimestamp) return 0;
  const t = new Date(m.waTimestamp).getTime();
  return Number.isFinite(t) ? t : 0;
}

/** Merge burst of consecutive image messages into one grid bubble. */
export function groupAdjacentImageMessages(
  messages: SupportMessage[],
): SupportMessage[] {
  const out: SupportMessage[] = [];

  for (const message of messages) {
    const prev = out[out.length - 1];
    const canMerge =
      prev &&
      isImageMessage(prev) &&
      isImageMessage(message) &&
      prev.author === message.author &&
      Math.abs(tsMs(message) - tsMs(prev)) <= IMAGE_GROUP_MS;

    if (!canMerge || !prev) {
      out.push({
        ...message,
        media: message.media ? [...message.media] : [],
      });
      continue;
    }

    const seen = new Set((prev.media ?? []).map((item) => item.url));
    const added = (message.media ?? []).filter((item) => {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    });
    const bodies = [prev.body, message.body]
      .map((b) => b.trim())
      .filter(Boolean);

    out[out.length - 1] = {
      ...prev,
      messageType: "image",
      media: [...(prev.media ?? []), ...added],
      body: bodies.length ? bodies[bodies.length - 1]! : "",
    };
  }

  return out;
}
