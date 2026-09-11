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
};

export const createCannedReplySchema = z.object(fields);

export const updateCannedReplySchema = z
  .object(fields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: "Nothing to update" });

export type CreateCannedReplyInput = z.infer<typeof createCannedReplySchema>;
export type UpdateCannedReplyInput = z.infer<typeof updateCannedReplySchema>;
