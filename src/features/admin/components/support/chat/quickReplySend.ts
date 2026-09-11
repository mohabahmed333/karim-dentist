import type { CannedReplyAttachment } from "@/services/whatsapp/cannedReplyInput";

/** WhatsApp's caption limit for images and documents. */
export const WHATSAPP_CAPTION_LIMIT = 1024;

export type QuickReplySendStep =
  | { kind: "text"; text: string }
  | { kind: "file"; caption: string }
  | { kind: "location" };

/**
 * The messages one composer send becomes when a quick reply carries an attachment.
 *
 * A file takes the text as its caption, so the patient gets a single message.
 * Text over WhatsApp's caption limit would be rejected, so it goes first on its
 * own. A location pin cannot carry a caption at all.
 */
export function planQuickReplySend(
  text: string,
  attachment: CannedReplyAttachment | null,
): QuickReplySendStep[] {
  const body = text.trim();
  const textStep: QuickReplySendStep[] = body ? [{ kind: "text", text: body }] : [];
  if (!attachment) return textStep;
  if (attachment.kind === "location") return [...textStep, { kind: "location" }];
  if (body.length > WHATSAPP_CAPTION_LIMIT) return [...textStep, { kind: "file", caption: "" }];
  return [{ kind: "file", caption: body }];
}
