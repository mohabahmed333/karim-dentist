import { z } from "zod";

export const treatmentUpsertSchema = z.object({
  tooth_name: z.string().trim().min(1, "Tooth name is required"),
  tooth_fdi: z
    .string()
    .trim()
    .min(1, "Select a tooth")
    .refine(
      (value) => /^([1-4][1-8]|[5-8][1-5])$/.test(value),
      "Invalid FDI tooth number",
    ),
  severity: z.enum(["Critical", "Minor"]),
  last_treatment: z.string().optional().default(""),
  cdt_code: z
    .string()
    .regex(/^D[0-9]{4}$/, "Invalid CDT code")
    .optional()
    .nullable(),
  phase: z.enum(["urgent", "restorative", "prosthodontic"]).optional(),
  fee_amount: z.number().int().min(0).optional(),
  ai_title: z.string().trim().optional().nullable().transform((v) => v || null),
  ai_description: z
    .string()
    .optional()
    .nullable()
    .transform((v) => v || null),
  ai_confidence: z
    .union([z.number().int().min(0).max(100), z.nan(), z.null()])
    .optional()
    .transform((v) => (typeof v === "number" && !Number.isNaN(v) ? v : null)),
  ai_recommendation: z
    .string()
    .optional()
    .nullable()
    .transform((v) => v || null),
  status: z.enum(["open", "scheduled", "done"]).default("open"),
});

export type TreatmentUpsertValues = z.infer<typeof treatmentUpsertSchema>;
