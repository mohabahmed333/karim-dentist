"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import type { CaseStudy, CaseStudyInsert, CaseStudyUpdate } from "./types";
import * as mutations from "./mutations";

export async function createCaseStudy(
  payload: CaseStudyInsert,
): Promise<CaseStudy> {
  const auth = await requirePermission("case-studies.create");
  if (auth.error) throw new Error("Forbidden");
  return mutations.createCaseStudy(auth.supabase, payload);
}

export async function updateCaseStudy(
  id: string,
  payload: CaseStudyUpdate,
): Promise<CaseStudy> {
  const auth = await requirePermission("case-studies.edit");
  if (auth.error) throw new Error("Forbidden");
  return mutations.updateCaseStudy(auth.supabase, id, payload);
}

export async function softDeleteCaseStudy(id: string): Promise<void> {
  const auth = await requirePermission("case-studies.delete");
  if (auth.error) throw new Error("Forbidden");
  return mutations.softDeleteCaseStudy(auth.supabase, id);
}
