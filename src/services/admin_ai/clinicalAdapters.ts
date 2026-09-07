import { toothSurfaceUpsertSchema } from "@/services/tooth_surfaces/schemas";
import { treatmentUpsertSchema } from "@/services/patient_treatments/schemas";
import { imagingCreateSchema } from "@/services/patient_imaging/schemas";
import type { ActionAdapter } from "./adapterTypes";
import {
  chartFindingInsertSchema,
  clinicalNoteInsertSchema,
  labOrderInsertSchema,
  prescriptionInsertSchema,
} from "./clinicalPayloads";
import { createClinicalNote } from "./clinicalNotesDb";
import {
  createLabOrder,
  createPrescription,
  updateLabStatus,
  upsertChartFinding,
} from "./clinicalRecordsDb";
import { fdiSchema } from "./schemas";

function str(value: unknown, fallback = ""): string {
  return value == null ? fallback : String(value);
}

export const chartSetSurfacesAdapter: ActionAdapter = {
  kind: "chart.set_surfaces",
  write: true,
  async preview(action, ctx) {
    const patientKey = str(action.payload.patientKey ?? ctx.patientKey);
    const fdi = fdiSchema.parse(action.payload.fdi ?? action.payload.tooth_fdi);
    const patch = toothSurfaceUpsertSchema.parse({
      fdi_number: fdi,
      dentition: action.payload.dentition ?? "adult",
      mesial: action.payload.mesial ?? "unmarked",
      distal: action.payload.distal ?? "unmarked",
      occlusal: action.payload.occlusal ?? "unmarked",
      facial: action.payload.facial ?? "unmarked",
      lingual: action.payload.lingual ?? "unmarked",
      whole: action.payload.whole ?? "none",
    });
    const { data } = await ctx.db
      .from("patient_tooth_surfaces")
      .select("*")
      .eq("patient_key", patientKey)
      .eq("fdi_number", fdi)
      .maybeSingle();
    const before = (data as Record<string, unknown>) ?? {};
    return {
      target: `surfaces:${patientKey}:${fdi}`,
      before,
      after: patch as unknown as Record<string, unknown>,
      snapshot: { [`surfaces:${fdi}`]: before },
    };
  },
  async execute(action, ctx) {
    const patientKey = str(action.payload.patientKey ?? ctx.patientKey);
    const fdi = fdiSchema.parse(action.payload.fdi ?? action.payload.tooth_fdi);
    const patch = toothSurfaceUpsertSchema.parse({
      fdi_number: fdi,
      dentition: action.payload.dentition ?? "adult",
      mesial: action.payload.mesial ?? "unmarked",
      distal: action.payload.distal ?? "unmarked",
      occlusal: action.payload.occlusal ?? "unmarked",
      facial: action.payload.facial ?? "unmarked",
      lingual: action.payload.lingual ?? "unmarked",
      whole: action.payload.whole ?? "none",
    });
    const { data, error } = await ctx.db
      .from("patient_tooth_surfaces")
      .upsert(
        {
          patient_key: patientKey,
          ...patch,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "patient_key,fdi_number" },
      )
      .select("*")
      .single();
    if (error) throw error;
    return {
      actionId: action.id,
      kind: action.kind,
      ok: true,
      message: `Updated surfaces on ${fdi}`,
      result: data as Record<string, unknown>,
    };
  },
};

export const chartUpsertFindingAdapter: ActionAdapter = {
  kind: "chart.upsert_finding",
  write: true,
  async preview(action, ctx) {
    const patientKey = str(action.payload.patientKey ?? ctx.patientKey);
    const parsed = chartFindingInsertSchema.parse({
      ...action.payload,
      patient_key: patientKey,
      tooth_fdi: action.payload.tooth_fdi ?? action.payload.fdi,
    });
    return {
      target: `finding:${patientKey}:${parsed.tooth_fdi}`,
      before: {},
      after: parsed as unknown as Record<string, unknown>,
      snapshot: { [`finding:${parsed.tooth_fdi}`]: {} },
    };
  },
  async execute(action, ctx) {
    const patientKey = str(action.payload.patientKey ?? ctx.patientKey);
    const row = await upsertChartFinding(ctx.db, {
      ...action.payload,
      patient_key: patientKey,
      tooth_fdi: String(action.payload.tooth_fdi ?? action.payload.fdi),
    } as never);
    return {
      actionId: action.id,
      kind: action.kind,
      ok: true,
      message: `Recorded finding on ${row.tooth_fdi}`,
      result: row as unknown as Record<string, unknown>,
    };
  },
};

export const noteClinicalAdapter: ActionAdapter = {
  kind: "note.clinical",
  write: true,
  async preview(action, ctx) {
    const patientKey = str(action.payload.patientKey ?? ctx.patientKey);
    const parsed = clinicalNoteInsertSchema.parse({
      ...action.payload,
      patient_key: patientKey,
    });
    return {
      target: `clinical-note:${patientKey}`,
      before: {},
      after: parsed as unknown as Record<string, unknown>,
      snapshot: { note: {} },
    };
  },
  async execute(action, ctx) {
    const patientKey = str(action.payload.patientKey ?? ctx.patientKey);
    const row = await createClinicalNote(
      ctx.db,
      {
        ...action.payload,
        patient_key: patientKey,
      } as never,
      ctx.actorId,
    );
    return {
      actionId: action.id,
      kind: action.kind,
      ok: true,
      message: "Clinical note saved",
      result: row as unknown as Record<string, unknown>,
    };
  },
};

export const noteGeneralAdapter: ActionAdapter = {
  kind: "note.general",
  write: true,
  async preview(action, ctx) {
    const patientKey = str(action.payload.patientKey ?? ctx.patientKey);
    const { data } = await ctx.db
      .from("patient_profiles")
      .select("notes,display_name,phone")
      .eq("patient_key", patientKey)
      .maybeSingle();
    const stamp = str(action.payload.text ?? action.payload.stamp);
    const line = `[${new Date().toLocaleString()}] ${stamp}`;
    const prev = str(data?.notes);
    return {
      target: `profile-note:${patientKey}`,
      before: { notes: prev },
      after: { notes: prev ? `${prev}\n${line}` : line },
      snapshot: { profile: data ?? {} },
    };
  },
  async execute(action, ctx) {
    const patientKey = str(action.payload.patientKey ?? ctx.patientKey);
    const { data: existing } = await ctx.db
      .from("patient_profiles")
      .select("*")
      .eq("patient_key", patientKey)
      .maybeSingle();
    const stamp = str(action.payload.text ?? action.payload.stamp);
    if (!stamp) throw new Error("Note text required");
    const line = `[${new Date().toLocaleString()}] ${stamp}`;
    const notes = existing?.notes
      ? `${String(existing.notes).trim()}\n${line}`
      : line;
    const payload = {
      patient_key: patientKey,
      display_name: str(
        action.payload.name ?? existing?.display_name,
        "Patient",
      ),
      phone: str(action.payload.phone ?? existing?.phone),
      notes,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await ctx.db
      .from("patient_profiles")
      .upsert(payload, { onConflict: "patient_key" })
      .select("*")
      .single();
    if (error) throw error;
    return {
      actionId: action.id,
      kind: action.kind,
      ok: true,
      message: "General note saved",
      result: data as Record<string, unknown>,
    };
  },
};

export const treatmentCreateAdapter: ActionAdapter = {
  kind: "treatment.create",
  write: true,
  async preview(action, ctx) {
    const patientKey = str(action.payload.patientKey ?? ctx.patientKey);
    const parsed = treatmentUpsertSchema.parse(action.payload);
    return {
      target: `treatment:${patientKey}:${parsed.tooth_fdi}`,
      before: {},
      after: parsed as unknown as Record<string, unknown>,
      snapshot: { treatment: {} },
    };
  },
  async execute(action, ctx) {
    const patientKey = str(action.payload.patientKey ?? ctx.patientKey);
    const parsed = treatmentUpsertSchema.parse(action.payload);
    const { data, error } = await ctx.db
      .from("patient_treatments")
      .insert({
        patient_key: patientKey,
        tooth_name: parsed.tooth_name,
        tooth_fdi: parsed.tooth_fdi || null,
        severity: parsed.severity,
        last_treatment: parsed.last_treatment ?? "",
        cdt_code: parsed.cdt_code ?? null,
        phase: parsed.phase ?? "restorative",
        fee_amount: parsed.fee_amount ?? 0,
        ai_title: parsed.ai_title || null,
        ai_description: parsed.ai_description || null,
        ai_confidence: parsed.ai_confidence ?? null,
        ai_recommendation: parsed.ai_recommendation || null,
        status: parsed.status ?? "open",
      })
      .select("*")
      .single();
    if (error) throw error;
    return {
      actionId: action.id,
      kind: action.kind,
      ok: true,
      message: `Created treatment for ${parsed.tooth_fdi}`,
      result: data as Record<string, unknown>,
    };
  },
};

export const treatmentUpdateAdapter: ActionAdapter = {
  kind: "treatment.update",
  write: true,
  async preview(action, ctx) {
    const id = str(action.payload.id);
    const { data, error } = await ctx.db
      .from("patient_treatments")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Treatment not found");
    const parsed = treatmentUpsertSchema.partial().parse(action.payload);
    return {
      target: `treatment:${id}`,
      before: data as Record<string, unknown>,
      after: { ...(data as object), ...parsed },
      snapshot: { [id]: data },
    };
  },
  async execute(action, ctx) {
    const id = str(action.payload.id);
    const parsed = treatmentUpsertSchema.partial().parse(action.payload);
    const { data, error } = await ctx.db
      .from("patient_treatments")
      .update({ ...parsed, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return {
      actionId: action.id,
      kind: action.kind,
      ok: true,
      message: "Treatment updated",
      result: data as Record<string, unknown>,
    };
  },
};

export const treatmentCompleteAdapter: ActionAdapter = {
  kind: "treatment.complete",
  write: true,
  async preview(action, ctx) {
    const id = str(action.payload.id);
    const { data } = await ctx.db
      .from("patient_treatments")
      .select("id,status")
      .eq("id", id)
      .maybeSingle();
    return {
      target: `treatment:${id}`,
      before: { status: data?.status ?? null },
      after: { status: "done" },
      snapshot: { [id]: data ?? {} },
    };
  },
  async execute(action, ctx) {
    const id = str(action.payload.id);
    const { data, error } = await ctx.db
      .from("patient_treatments")
      .update({ status: "done", updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return {
      actionId: action.id,
      kind: action.kind,
      ok: true,
      message: "Treatment marked done",
      result: data as Record<string, unknown>,
    };
  },
};

export const imagingAttachAdapter: ActionAdapter = {
  kind: "imaging.attach",
  write: true,
  async preview(action, ctx) {
    const patientKey = str(action.payload.patientKey ?? ctx.patientKey);
    const parsed = imagingCreateSchema.parse(action.payload);
    return {
      target: `imaging:${patientKey}`,
      before: {},
      after: parsed as unknown as Record<string, unknown>,
      snapshot: { imaging: {} },
      warnings: ["Images are attached only — no diagnosis is inferred."],
    };
  },
  async execute(action, ctx) {
    const patientKey = str(action.payload.patientKey ?? ctx.patientKey);
    const parsed = imagingCreateSchema.parse(action.payload);
    const { data, error } = await ctx.db
      .from("patient_imaging")
      .insert({
        patient_key: patientKey,
        title: parsed.title,
        kind: parsed.kind,
        tooth_number: parsed.tooth_number ?? null,
        tooth_fdi: parsed.tooth_fdi ?? null,
        file_url: parsed.file_url,
        file_name: parsed.file_name,
        mime_type: parsed.mime_type,
        taken_at: parsed.taken_at ?? null,
      })
      .select("*")
      .single();
    if (error) throw error;
    return {
      actionId: action.id,
      kind: action.kind,
      ok: true,
      message: "Imaging attached",
      result: data as Record<string, unknown>,
    };
  },
};

export const rxCreateAdapter: ActionAdapter = {
  kind: "rx.create",
  write: true,
  async preview(action, ctx) {
    const patientKey = str(action.payload.patientKey ?? ctx.patientKey);
    const parsed = prescriptionInsertSchema.parse({
      ...action.payload,
      patient_key: patientKey,
    });
    return {
      target: `rx:${patientKey}`,
      before: {},
      after: parsed as unknown as Record<string, unknown>,
      snapshot: { rx: {} },
    };
  },
  async execute(action, ctx) {
    const patientKey = str(action.payload.patientKey ?? ctx.patientKey);
    const row = await createPrescription(
      ctx.db,
      { ...action.payload, patient_key: patientKey } as never,
      ctx.actorId,
    );
    return {
      actionId: action.id,
      kind: action.kind,
      ok: true,
      message: "Prescription created",
      result: row as unknown as Record<string, unknown>,
    };
  },
};

export const labCreateAdapter: ActionAdapter = {
  kind: "lab.create",
  write: true,
  async preview(action, ctx) {
    const patientKey = str(action.payload.patientKey ?? ctx.patientKey);
    const parsed = labOrderInsertSchema.parse({
      ...action.payload,
      patient_key: patientKey,
    });
    return {
      target: `lab:${patientKey}`,
      before: {},
      after: parsed as unknown as Record<string, unknown>,
      snapshot: { lab: {} },
    };
  },
  async execute(action, ctx) {
    const patientKey = str(action.payload.patientKey ?? ctx.patientKey);
    const row = await createLabOrder(
      ctx.db,
      { ...action.payload, patient_key: patientKey } as never,
      ctx.actorId,
    );
    return {
      actionId: action.id,
      kind: action.kind,
      ok: true,
      message: "Lab order created",
      result: row as unknown as Record<string, unknown>,
    };
  },
};

export const labUpdateStatusAdapter: ActionAdapter = {
  kind: "lab.update_status",
  write: true,
  async preview(action, ctx) {
    const id = str(action.payload.id);
    const status = str(action.payload.status);
    const { data } = await ctx.db
      .from("patient_lab_orders")
      .select("id,status")
      .eq("id", id)
      .maybeSingle();
    return {
      target: `lab:${id}`,
      before: { status: data?.status ?? null },
      after: { status },
      snapshot: { [id]: data ?? {} },
    };
  },
  async execute(action, ctx) {
    const row = await updateLabStatus(
      ctx.db,
      str(action.payload.id),
      str(action.payload.status) as never,
    );
    return {
      actionId: action.id,
      kind: action.kind,
      ok: true,
      message: `Lab status → ${row.status}`,
      result: row as unknown as Record<string, unknown>,
    };
  },
};
