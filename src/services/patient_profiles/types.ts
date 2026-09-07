export type PatientGender =
  | ""
  | "female"
  | "male"
  | "other"
  | "prefer_not";

export type PatientProfile = {
  id: string;
  patient_key: string;
  display_name: string;
  phone: string;
  email: string | null;
  date_of_birth: string | null;
  age_years: number | null;
  gender: PatientGender;
  medical_history: string[];
  allergies: string[];
  medications: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export function emptyPatientProfile(
  patientKey: string,
  seed?: { displayName?: string; phone?: string; email?: string | null },
): Omit<PatientProfile, "id" | "created_at" | "updated_at"> {
  return {
    patient_key: patientKey,
    display_name: seed?.displayName ?? "",
    phone: seed?.phone ?? "",
    email: seed?.email ?? null,
    date_of_birth: null,
    age_years: null,
    gender: "",
    medical_history: [],
    allergies: [],
    medications: "",
    notes: "",
  };
}
