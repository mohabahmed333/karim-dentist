import { lastStrongLocale } from "./textDirection";

/**
 * A create payload from a message staff already sent.
 *
 * The English body is required, so an Arabic message fills both bodies: the
 * reply works straight away, and staff can add an English version later.
 */
export function quickReplyFromMessage(
  text: string,
  input: { slashKey: string; title: string; category: string },
) {
  const body = text.trim();
  return {
    slash_key: input.slashKey.trim().toLowerCase(),
    title: input.title.trim(),
    category: input.category.trim() || null,
    body,
    body_ar: lastStrongLocale(body) === "ar" ? body : null,
  };
}
