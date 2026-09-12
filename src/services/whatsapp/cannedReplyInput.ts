import { z } from "zod";
import { findUnknownFields } from "./quickReplyFields";

export const QUICK_REPLY_BUCKET = "whatsapp-quick-replies";

/**
 * On send the file goes through our /api/v1/whatsapp/send function, whose
 * request body Vercel caps near 4.5 MB — well under WhatsApp's own limits.
 */
export const QUICK_REPLY_MAX_FILE_BYTES = 4 * 1024 * 1024;

const storedFile = {
  path: z.string().min(1).max(300),
  name: z.string().min(1).max(200),
  size: z.number().int().positive().max(QUICK_REPLY_MAX_FILE_BYTES),
};

export const cannedReplyAttachmentSchema = z.discriminatedUnion("kind", [
  // WhatsApp only accepts JPEG and PNG images.
  z.object({ kind: z.literal("image"), mime: z.enum(["image/jpeg", "image/png"]), ...storedFile }),
  z.object({ kind: z.literal("document"), mime: z.literal("application/pdf"), ...storedFile }),
  z.object({ kind: z.literal("location") }),
]);

export type CannedReplyAttachment = z.infer<typeof cannedReplyAttachmentSchema>;

/** WhatsApp caps reply button titles at 20 characters and a message at 3 buttons. */
export const QUICK_REPLY_BUTTON_TITLE_MAX = 20;
export const QUICK_REPLY_BUTTONS_MAX = 3;

export type QuickReplyButton = { title: string; title_ar: string | null };

export type ButtonLabelProblem = "duplicate_en" | "duplicate_ar" | "field_in_label";

const FIELD_IN_LABEL = /\{\{[^}]*\}\}/;

/**
 * What stops a reply's buttons from being saved, beyond length and count.
 * WhatsApp rejects duplicate titles, and a {{field}} can't be filled into a
 * 20-character label. Shared by the editor (inline errors) and the schema.
 */
export function findButtonLabelProblems(
  buttons: { title: string; title_ar?: string | null }[],
): ButtonLabelProblem[] {
  const problems = new Set<ButtonLabelProblem>();
  const english = new Set<string>();
  const arabic = new Set<string>();
  for (const button of buttons) {
    const en = button.title.trim();
    const ar = (button.title_ar ?? "").trim();
    if (FIELD_IN_LABEL.test(en) || FIELD_IN_LABEL.test(ar)) problems.add("field_in_label");
    const enKey = en.toLowerCase();
    if (enKey) {
      if (english.has(enKey)) problems.add("duplicate_en");
      english.add(enKey);
    }
    const arKey = ar.toLowerCase();
    if (arKey) {
      if (arabic.has(arKey)) problems.add("duplicate_ar");
      arabic.add(arKey);
    }
  }
  return [...problems];
}

const BUTTON_PROBLEM_MESSAGES: Record<ButtonLabelProblem, string> = {
  duplicate_en: "Button labels must be unique",
  duplicate_ar: "Arabic button labels must be unique",
  field_in_label: "Button labels can't contain fill-in fields",
};

const quickReplyButtonSchema = z.object({
  title: z.string().trim().min(1).max(QUICK_REPLY_BUTTON_TITLE_MAX),
  title_ar: z
    .string()
    .trim()
    .max(QUICK_REPLY_BUTTON_TITLE_MAX)
    .nullable()
    .optional()
    .transform((value) => value || null),
});

/** Up to 3 buttons; an empty list is stored as no buttons. */
export const cannedReplyButtonsSchema = z
  .array(quickReplyButtonSchema)
  .max(QUICK_REPLY_BUTTONS_MAX)
  .superRefine((buttons, ctx) => {
    for (const problem of findButtonLabelProblems(buttons)) {
      ctx.addIssue({ code: "custom", message: BUTTON_PROBLEM_MESSAGES[problem] });
    }
  })
  .nullable()
  .transform((buttons): QuickReplyButton[] | null => (buttons && buttons.length ? buttons : null));

const noUnknownFields = (text: string | null | undefined) =>
  findUnknownFields(text ?? "").length === 0;
const UNKNOWN_FIELD_MESSAGE = "Unknown fill-in field";

const fields = {
  slash_key: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .regex(/^[a-z0-9_-]+$/i)
    .transform((key) => key.toLowerCase()),
  title: z.string().trim().min(1).max(80),
  title_ar: z.string().trim().max(80).nullable().optional(),
  body: z.string().trim().min(1).max(2000).refine(noUnknownFields, UNKNOWN_FIELD_MESSAGE),
  body_ar: z
    .string()
    .trim()
    .max(2000)
    .nullable()
    .optional()
    .refine(noUnknownFields, UNKNOWN_FIELD_MESSAGE),
  category: z.string().trim().max(40).nullable().optional(),
  sort_order: z.number().int().optional(),
  active: z.boolean().optional(),
  attachment: cannedReplyAttachmentSchema.nullable().optional(),
  buttons: cannedReplyButtonsSchema.optional(),
};

export const createCannedReplySchema = z.object(fields);

export const updateCannedReplySchema = z
  .object(fields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: "Nothing to update" });

export type CreateCannedReplyInput = z.infer<typeof createCannedReplySchema>;
export type UpdateCannedReplyInput = z.infer<typeof updateCannedReplySchema>;
