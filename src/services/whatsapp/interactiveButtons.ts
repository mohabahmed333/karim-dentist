import { BUTTON_TITLE_LIMIT } from "@/services/patient_notifications/formatWhen";

/** WhatsApp's body limit for a message with reply buttons. */
export const INTERACTIVE_BODY_LIMIT = 1024;

export type InteractiveButtonsProblem =
  | "no_buttons"
  | "body_too_long"
  | "duplicate_titles"
  | "title_too_long";

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
  // Meta rejects the whole message over one long title, so this is not a
  // cosmetic rule: an overrun costs the patient the words as well as the button.
  if (titles.some((title) => title.length > BUTTON_TITLE_LIMIT)) return "title_too_long";
  return null;
}

/**
 * WhatsApp's limits for a list message, which are not the button limits.
 *
 * A list is the only way to offer more than three choices, and the only way to
 * show a service name that will not fit on a button.
 */
export const LIST_ROW_LIMIT = 10;
export const LIST_ROW_TITLE_LIMIT = 24;
export const LIST_ROW_DESCRIPTION_LIMIT = 72;
export const LIST_BUTTON_LABEL_LIMIT = 20;

export type InteractiveListProblem =
  | "no_rows"
  | "too_many_rows"
  | "body_too_long"
  | "row_title_too_long"
  | "row_description_too_long"
  | "button_label_too_long"
  | "duplicate_row_ids";

export type InteractiveList = {
  /** The label on the control that opens the list. */
  button: string;
  rows: { id: string; title: string; description?: string }[];
};

/**
 * Why WhatsApp would reject a list message.
 *
 * Same contract as the button check: every one of these costs the whole
 * message, so they are worth catching before the send rather than after.
 */
export function checkInteractiveList(
  text: string,
  list: InteractiveList | undefined,
): InteractiveListProblem | null {
  if (!list || list.rows.length === 0) return "no_rows";
  if (list.rows.length > LIST_ROW_LIMIT) return "too_many_rows";
  if (text.length > INTERACTIVE_BODY_LIMIT) return "body_too_long";
  if (list.button.trim().length === 0 || list.button.length > LIST_BUTTON_LABEL_LIMIT) {
    return "button_label_too_long";
  }
  if (list.rows.some((row) => row.title.trim().length === 0 || row.title.length > LIST_ROW_TITLE_LIMIT)) {
    return "row_title_too_long";
  }
  if (list.rows.some((row) => (row.description?.length ?? 0) > LIST_ROW_DESCRIPTION_LIMIT)) {
    return "row_description_too_long";
  }
  const ids = list.rows.map((row) => row.id);
  if (new Set(ids).size !== ids.length) return "duplicate_row_ids";
  return null;
}
