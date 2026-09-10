import { z } from "zod";

export const waitlistEntrySchema = z
  .object({
    patient_name: z.string().trim().min(1).max(120),
    phone: z.string().trim().min(6).max(40),
    service_id: z.string().uuid().nullable().optional(),
    service_label: z.string().trim().max(200).optional().default(""),
    preferred_from: z.string().datetime().nullable().optional(),
    preferred_to: z.string().datetime().nullable().optional(),
    notes: z.string().max(500).optional().default(""),
  })
  .refine(
    (v) =>
      !v.preferred_from ||
      !v.preferred_to ||
      Date.parse(v.preferred_to) > Date.parse(v.preferred_from),
    { message: "preferred_to must be after preferred_from", path: ["preferred_to"] },
  );

export type WaitlistEntryInput = z.infer<typeof waitlistEntrySchema>;
