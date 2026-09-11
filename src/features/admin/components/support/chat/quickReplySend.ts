import type { CannedReplyAttachment } from "@/services/whatsapp/cannedReplyInput";
import { INTERACTIVE_BODY_LIMIT } from "@/services/whatsapp/interactiveButtons";

/** WhatsApp's caption limit for images and documents. */
export const WHATSAPP_CAPTION_LIMIT = 1024;

export type QuickReplyButtonSend = { id: string; title: string };

export type QuickReplySendStep =
  | { kind: "text"; text: string }
  | { kind: "file"; caption: string }
  | { kind: "location" }
  /** An empty `text` means the buttons carry the default "Please choose an option:" prompt. */
  | { kind: "buttons"; text: string; buttons: QuickReplyButtonSend[] };

/**
 * The messages one composer send becomes when a quick reply carries an
 * attachment and/or reply buttons.
 *
 * Without buttons, a file takes the text as its caption, text over the caption
 * limit goes first, and a location pin follows the text.
 *
 * With buttons, the attachment goes first (a file without a caption) so the
 * buttons are the last thing the patient sees. Text over WhatsApp's interactive
 * body limit is sent on its own before the buttons.
 */
export function planQuickReplySend(
  text: string,
  attachment: CannedReplyAttachment | null,
  buttons: QuickReplyButtonSend[] = [],
): QuickReplySendStep[] {
  const body = text.trim();

  if (buttons.length) {
    const lead: QuickReplySendStep[] = !attachment
      ? []
      : attachment.kind === "location"
        ? [{ kind: "location" }]
        : [{ kind: "file", caption: "" }];
    if (body.length > INTERACTIVE_BODY_LIMIT) {
      return [...lead, { kind: "text", text: body }, { kind: "buttons", text: "", buttons }];
    }
    return [...lead, { kind: "buttons", text: body, buttons }];
  }

  const textStep: QuickReplySendStep[] = body ? [{ kind: "text", text: body }] : [];
  if (!attachment) return textStep;
  if (attachment.kind === "location") return [...textStep, { kind: "location" }];
  if (body.length > WHATSAPP_CAPTION_LIMIT) return [...textStep, { kind: "file", caption: "" }];
  return [{ kind: "file", caption: body }];
}
