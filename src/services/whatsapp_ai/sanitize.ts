const MAX_LENGTH = 1200;

/** Zero-width and bidi-override characters — used to hide text from a reviewer. */
const INVISIBLE = /[\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]/g;
/** C0/C1 control characters, keeping \n and \t. */
const CONTROLS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;

/**
 * Neutralise a patient message before it is shown to the model.
 *
 * Structural, not semantic: it removes the characters that let text *escape*
 * its container — code fences that could forge a JSON envelope, and control or
 * bidi characters that make the stored text differ from what a reviewer sees.
 * Arabic, emoji and ordinary punctuation are deliberately preserved; deciding
 * whether the content is an attack is injectionHeuristics' job.
 */
export function sanitizePatientText(input: string): string {
  return input
    .replace(INVISIBLE, "")
    .replace(CONTROLS, "")
    // Backticks would let a patient forge a fenced JSON envelope of their own.
    .replace(/`/g, "'")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_LENGTH);
}

/**
 * Wrap patient text as a JSON value so it cannot be read as instructions.
 *
 * JSON escaping neutralises newlines and quotes structurally, and the wrapper
 * makes the boundary between "data" and "prompt" explicit to the model.
 */
export function wrapPatientTurn(text: string): string {
  return JSON.stringify({
    channel: "whatsapp",
    role: "patient",
    text: sanitizePatientText(text),
  });
}
