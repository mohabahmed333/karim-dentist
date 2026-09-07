import { z } from "zod";
import { fdiSchema } from "@/services/admin_ai/schemas";

export const clinicalNoteCategorySchema = z.enum([
  "SOAP",
  "Quick Note",
  "Alert",
  "Lab",
]);

export const clinicalNoteInsertSchema = z.object({
  patient_key: z.string().min(1),
  category: clinicalNoteCategorySchema,
  content: z.string().trim().min(1).max(8000),
  target_kind: z.enum(["visit", "tooth", "treatment"]).default("visit"),
  target_id: z.string().min(1).default("visit"),
  tooth_fdi: fdiSchema.nullable().optional(),
  treatment_id: z.string().uuid().nullable().optional(),
  author: z.string().min(1).default("Dentist"),
});

export type ClinicalNoteInsert = z.infer<typeof clinicalNoteInsertSchema>;

export const chartFindingInsertSchema = z.object({
  patient_key: z.string().min(1),
  tooth_fdi: fdiSchema,
  condition_type: z.string().min(1).max(80),
  severity: z.enum(["LOW", "MED", "HIGH", "CRITICAL"]).default("MED"),
  status: z.enum(["ACTIVE", "RESOLVED", "MONITORING"]).default("ACTIVE"),
  vitality_index: z.number().min(0).max(180).nullable().optional(),
  note: z.string().max(2000).default(""),
});

export type ChartFindingInsert = z.infer<typeof chartFindingInsertSchema>;

export const prescriptionInsertSchema = z.object({
  patient_key: z.string().min(1),
  medication: z.string().trim().min(1).max(120),
  dose: z.string().trim().min(1).max(80),
  frequency: z.enum(["ONCE_DAILY", "TWICE_DAILY", "NIGHT_ONLY"]),
  duration_days: z.number().int().min(1).max(365).default(7),
  instructions: z.string().max(1000).default(""),
  tooth_fdi: fdiSchema.nullable().optional(),
});

export type PrescriptionInsert = z.infer<typeof prescriptionInsertSchema>;

export const labOrderInsertSchema = z.object({
  patient_key: z.string().min(1),
  appliance_type: z.string().trim().min(1).max(80),
  status: z
    .enum(["IMPRESSION", "FABRICATION", "SHIPPED", "DELIVERED"])
    .default("IMPRESSION"),
  tooth_fdi: fdiSchema.nullable().optional(),
  notes: z.string().max(2000).default(""),
});

export type LabOrderInsert = z.infer<typeof labOrderInsertSchema>;
