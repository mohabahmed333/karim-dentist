/** WhatsApp's body limit for a message with reply buttons. */
export const INTERACTIVE_BODY_LIMIT = 1024;

export type InteractiveButtonsProblem = "no_buttons" | "body_too_long" | "duplicate_titles";

/**
 * Why WhatsApp would reject a reply-button message. Checked before calling
 * Kapso, so staff get a clear 400 instead of a generic send failure.
 */
export function checkInteractiveButtons(
  text: string,
  buttons: { title: string }[] | undefined,
): InteractiveButtonsProblem | null {
  if (!buttons || buttons.length === 0) return "no_buttons";
  if (text.length > INTERACTIVE_BODY_LIMIT) return "body_too_long";
  const titles = buttons.map((button) => button.title.trim().toLowerCase());
  if (new Set(titles).size !== titles.length) return "duplicate_titles";
  return null;
}
