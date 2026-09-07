export const AGE_CHIPS = ["5", "12", "18", "25", "35", "45", "55", "65"] as const;

export const GENDER_CHIPS: { value: string; label: string }[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
  { value: "prefer_not", label: "Prefer not" },
];

export const MEDICAL_HISTORY_CHIPS = [
  "Hypertension",
  "Diabetes",
  "Heart disease",
  "Asthma",
  "Thyroid",
  "Pregnancy",
  "None reported",
] as const;

export const ALLERGY_CHIPS = [
  "No known allergies",
  "Penicillin",
  "Latex",
  "Local anesthetic",
  "NSAIDs",
  "Iodine",
] as const;
