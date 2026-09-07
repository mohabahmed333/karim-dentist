import { z } from "zod";

export const imagingKindSchema = z.enum(["xray", "cbct", "photo"]);

export const imagingCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  kind: imagingKindSchema.default("xray"),
  tooth_number: z
    .number()
    .int()
    .min(1)
    .max(32)
    .nullable()
    .optional(),
  tooth_fdi: z
    .string()
    .regex(/^([1-4][1-8]|[5-8][1-5])$/)
    .nullable()
    .optional(),
  taken_at: z.string().datetime().nullable().optional(),
  file_url: z.string().url(),
  file_name: z.string().trim().min(1),
  mime_type: z.string().trim().min(1),
});

export type ImagingCreateValues = z.infer<typeof imagingCreateSchema>;
