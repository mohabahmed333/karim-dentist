import { z } from "zod";

export const publicBookSchema = z.object({
  slot_id: z.string().uuid(),
  patient_name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(1).max(40),
  email: z.string().trim().email().optional().or(z.literal("")),
  service_id: z.string().uuid().nullable().optional(),
  service_label: z.string().trim().min(1).max(200),
  notes: z.string().max(2000).optional().default(""),
});

export type PublicBookValues = z.infer<typeof publicBookSchema>;
