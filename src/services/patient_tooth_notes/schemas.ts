import { z } from "zod";
import { FDI_PATTERN } from "../notation/types";

function isNoteBodyEmpty(html: string): boolean {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length === 0;
}

const fdiNumber = z.string().regex(FDI_PATTERN, "Invalid tooth number");

const noteBody = z
  .string()
  .transform((value) => (/<[a-z][\s\S]*>/i.test(value) ? value : value.trim()))
  .refine((value) => !isNoteBodyEmpty(value), "Note is required");

export const toothNoteBodySchema = z.object({
  fdi_number: fdiNumber,
  body: noteBody,
});

export const toothNoteUpdateSchema = z.object({
  body: noteBody,
});

export const attachmentInputSchema = z.object({
  file_url: z.string().url(),
  file_name: z.string().trim().min(1),
  mime_type: z.string().trim().min(1),
  kind: z.enum(["image", "file"]),
});

export type ToothNoteBodyValues = z.infer<typeof toothNoteBodySchema>;
