import { patientProfileUpsertSchema } from "@/services/patient_profiles/schemas";
import type { ActionAdapter, ActionContext } from "./adapterTypes";

function str(value: unknown, fallback = ""): string {
  return value == null ? fallback : String(value);
}

function resolvePatientKey(action: { payload: Record<string, unknown> }, ctx: ActionContext) {
  const key = str(action.payload.patientKey ?? ctx.patientKey).trim();
  if (!key) throw new Error("patientKey is required");
  return key;
}

async function loadProfile(ctx: ActionContext, patientKey: string) {
  const { data, error } = await ctx.db
    .from("patient_profiles")
    .select("*")
    .eq("patient_key", patientKey)
    .maybeSingle();
  if (error) throw new Error(error.message || "Could not load patient profile");
  return (data as Record<string, unknown>) ?? null;
}

/**
 * Merge fields into a patient profile.
 *
 * Merge, not replace: the model only ever sees the part of the record the
 * conversation is about, so treating its payload as the whole row would silently
 * erase allergies or medical history it never mentioned.
 */
export const patientUpsertProfileAdapter: ActionAdapter = {
  kind: "patient.upsert_profile",
  write: true,
  async preview(action, ctx) {
    const patientKey = resolvePatientKey(action, ctx);
    const existing = await loadProfile(ctx, patientKey);
    const merged = mergeProfile(existing, action.payload);
    return {
      target: `patient:${patientKey}`,
      before: existing ?? {},
      after: merged as unknown as Record<string, unknown>,
      snapshot: { [`profile:${patientKey}`]: existing },
      warnings: existing ? [] : ["Creates a new patient profile"],
    };
  },
  async execute(action, ctx) {
    const patientKey = resolvePatientKey(action, ctx);
    const existing = await loadProfile(ctx, patientKey);
    const merged = mergeProfile(existing, action.payload);
    const { error } = await ctx.db.from("patient_profiles").upsert(
      { patient_key: patientKey, ...merged, updated_at: new Date().toISOString() },
      { onConflict: "patient_key" },
    );
    if (error) throw new Error(error.message || "Could not save patient profile");
    return {
      actionId: action.id,
      kind: action.kind,
      ok: true,
      message: existing ? "Patient profile updated" : "Patient profile created",
      result: { patientKey },
    };
  },
};

/** Fields the AI may write. Anything else in the payload is ignored. */
const PROFILE_FIELDS = [
  "display_name",
  "phone",
  "email",
  "date_of_birth",
  "age_years",
  "gender",
  "medical_history",
  "allergies",
  "medications",
  "notes",
] as const;

export function mergeProfile(
  existing: Record<string, unknown> | null,
  payload: Record<string, unknown>,
) {
  const base: Record<string, unknown> = {
    display_name: existing?.display_name ?? "",
    phone: existing?.phone ?? "",
    email: existing?.email ?? null,
    date_of_birth: existing?.date_of_birth ?? null,
    age_years: existing?.age_years ?? null,
    gender: existing?.gender ?? "",
    medical_history: existing?.medical_history ?? [],
    allergies: existing?.allergies ?? [],
    medications: existing?.medications ?? "",
    notes: existing?.notes ?? "",
  };
  for (const field of PROFILE_FIELDS) {
    if (payload[field] !== undefined) base[field] = payload[field];
  }
  if (!str(base.display_name).trim()) {
    throw new Error("display_name is required for a patient profile");
  }
  return patientProfileUpsertSchema.parse(base);
}

const ENCOUNTER_MAX_LENGTH = 120;

/**
 * Record a completed visit.
 *
 * Encounters are `reservations` rows with status 'completed' — the same shape
 * the patient timeline and dental chart already read, so this stays consistent
 * with the /encounters route rather than inventing a parallel record.
 */
export const encounterCreateAdapter: ActionAdapter = {
  kind: "encounter.create",
  write: true,
  async preview(action, ctx) {
    const patientKey = resolvePatientKey(action, ctx);
    const type = str(action.payload.type).trim();
    if (!type) throw new Error("Encounter type is required");
    if (type.length > ENCOUNTER_MAX_LENGTH) {
      throw new Error("Encounter type is too long");
    }
    const timestamp = str(action.payload.timestamp) || new Date().toISOString();
    if (Number.isNaN(Date.parse(timestamp))) {
      throw new Error("Encounter timestamp is not a valid date");
    }
    return {
      target: `patient:${patientKey}`,
      before: {},
      after: { type, timestamp, notes: str(action.payload.notes) },
      snapshot: { [`encounter:${patientKey}`]: timestamp },
      warnings:
        Date.parse(timestamp) > Date.now()
          ? ["Encounter is dated in the future"]
          : [],
    };
  },
  async execute(action, ctx) {
    const patientKey = resolvePatientKey(action, ctx);
    const phone = patientKey.startsWith("phone:")
      ? patientKey.slice("phone:".length)
      : str(action.payload.phone);
    const { error } = await ctx.db.from("reservations").insert({
      patient_name: str(action.payload.patient_name, "Patient"),
      phone,
      service_label: str(action.payload.type).trim(),
      starts_at: str(action.payload.timestamp) || new Date().toISOString(),
      notes: str(action.payload.notes),
      status: "completed",
    });
    if (error) throw new Error(error.message || "Could not record encounter");
    return {
      actionId: action.id,
      kind: action.kind,
      ok: true,
      message: "Encounter recorded",
      result: { patientKey },
    };
  },
};

export const patientAdapters: ActionAdapter[] = [
  patientUpsertProfileAdapter,
  encounterCreateAdapter,
];
