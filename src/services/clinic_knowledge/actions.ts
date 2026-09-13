"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import type {
  ClinicKnowledge,
  ClinicKnowledgeInsert,
  ClinicKnowledgeUpdate,
} from "./types";
import * as mutations from "./mutations";

export async function createClinicKnowledge(
  payload: ClinicKnowledgeInsert,
): Promise<ClinicKnowledge> {
  const auth = await requirePermission("knowledge.create");
  if (auth.error) throw new Error("Forbidden");
  return mutations.createClinicKnowledge(auth.supabase, payload);
}

export async function updateClinicKnowledge(
  id: string,
  payload: ClinicKnowledgeUpdate,
): Promise<ClinicKnowledge> {
  const auth = await requirePermission("knowledge.edit");
  if (auth.error) throw new Error("Forbidden");
  return mutations.updateClinicKnowledge(auth.supabase, id, payload);
}

export async function softDeleteClinicKnowledge(id: string): Promise<void> {
  const auth = await requirePermission("knowledge.delete");
  if (auth.error) throw new Error("Forbidden");
  return mutations.softDeleteClinicKnowledge(auth.supabase, id);
}
