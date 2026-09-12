import type { ZodType } from "zod";
import { searchPatients, searchPatientsArgs } from "./searchPatients";
import { getPatientSummary, getPatientSummaryArgs } from "./getPatientSummary";
import { listReservationsTool, listReservationsToolArgs } from "./listReservationsTool";
import { findOpenSlots, findOpenSlotsArgs } from "./findOpenSlots";
import { searchKnowledgeTool, searchKnowledgeArgs } from "./searchKnowledgeTool";
import type { ToolDb } from "./types";

export type ToolResult = { ok: true; data: unknown } | { ok: false; error: string };

type AnyTool = {
  /** One line, shown to the model in the tool catalog. */
  description: string;
  argsSchema: ZodType;
  run: (db: ToolDb, args: never) => Promise<unknown>;
};

function tool<A>(
  description: string,
  argsSchema: ZodType<A>,
  run: (db: ToolDb, args: A) => Promise<unknown>,
): AnyTool {
  return { description, argsSchema, run: run as AnyTool["run"] };
}

/**
 * What Clinic Assist may look up. All read-only — every write still goes
 * through `proposedActions` and the Confirm registry in `../registry.ts`.
 */
export const CLINIC_ASSIST_TOOLS: Record<string, AnyTool> = {
  search_patients: tool(
    'Find patients by name or phone. args: { "query": string }',
    searchPatientsArgs,
    searchPatients,
  ),
  get_patient_summary: tool(
    'Full visit history for one patient. args: { "patientKey": string }',
    getPatientSummaryArgs,
    getPatientSummary,
  ),
  list_reservations: tool(
    'Appointments in a date range, beyond what Clinic context already lists. args: { "from": "YYYY-MM-DD", "to"?: "YYYY-MM-DD", "status"?: "pending"|"confirmed"|"cancelled"|"completed"|"no_show" }',
    listReservationsToolArgs,
    listReservationsTool,
  ),
  find_open_slots: tool(
    'Open appointment slots on one day, beyond what Clinic context already lists. args: { "date": "YYYY-MM-DD" }',
    findOpenSlotsArgs,
    findOpenSlots,
  ),
  search_clinic_knowledge: tool(
    'Clinic policies and FAQs staff have written down. args: { "query": string }',
    searchKnowledgeArgs,
    searchKnowledgeTool,
  ),
};

/** Run one tool call, turning every failure mode into a `ToolResult` the model can read and recover from. */
export async function runTool(
  db: ToolDb,
  name: string,
  rawArgs: unknown,
): Promise<ToolResult> {
  const entry = CLINIC_ASSIST_TOOLS[name];
  if (!entry) {
    return {
      ok: false,
      error: `Unknown tool "${name}". Available: ${Object.keys(CLINIC_ASSIST_TOOLS).join(", ")}`,
    };
  }

  const parsed = entry.argsSchema.safeParse(rawArgs ?? {});
  if (!parsed.success) {
    return {
      ok: false,
      error: `Bad arguments for ${name}: ${parsed.error.issues.map((i) => i.message).join("; ")}`,
    };
  }

  try {
    return { ok: true, data: await entry.run(db, parsed.data as never) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : `${name} failed` };
  }
}
