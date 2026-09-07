import { z } from "zod";

export const patientGenderSchema = z.enum([
  "",
  "female",
  "male",
  "other",
  "prefer_not",
]);

const emptyToNull = (value: unknown) => {
  if (value == null) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
};

export const patientProfileUpsertSchema = z.object({
  display_name: z.string().trim().min(1, "Name is required").max(120),
  phone: z.string().trim().max(40).default(""),
  email: z.preprocess(emptyToNull, z.string().email().nullable()),
  date_of_birth: z.preprocess(
    emptyToNull,
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
      .nullable(),
  ),
  age_years: z.preprocess((value) => {
    if (value === "" || value == null) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : value;
  }, z.number().int().min(0).max(130).nullable()),
  gender: patientGenderSchema.default(""),
  medical_history: z.array(z.string().trim().min(1)).max(40).default([]),
  allergies: z.array(z.string().trim().min(1)).max(40).default([]),
  medications: z.string().trim().max(4000).default(""),
  notes: z.string().trim().max(8000).default(""),
});

export type PatientProfileUpsertValues = z.infer<
  typeof patientProfileUpsertSchema
>;
