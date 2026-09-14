import { z } from "zod";

export const publicBookSchema = z.object({
  slot_id: z.string().uuid(),
  patient_name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(1).max(40),
  email: z.string().trim().email().optional().or(z.literal("")),
  service_id: z.string().uuid().nullable().optional(),
  service_label: z.string().trim().min(1).max(200),
  // Which doctor the patient picked on the form, if any — a defensive
  // cross-check only. The slot itself is what actually decides the
  // reservation's doctor (book_open_appointment_slot copies it from the
  // slot), so this never changes who the booking is with; it just lets the
  // route catch and explain a stale pick with a clearer error than the
  // generic "slot no longer available".
  doctor_id: z.string().uuid().nullable().optional(),
  notes: z.string().max(500).optional().default(""),
});

export type PublicBookValues = z.infer<typeof publicBookSchema>;
