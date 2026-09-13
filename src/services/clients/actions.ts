"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import type { Client, ClientInsert, ClientUpdate } from "./types";
import * as mutations from "./mutations";

export async function createClientRow(payload: ClientInsert): Promise<Client> {
  const auth = await requirePermission("clients.create");
  if (auth.error) throw new Error("Forbidden");
  return mutations.createClientRow(auth.supabase, payload);
}

export async function updateClient(id: string, payload: ClientUpdate): Promise<Client> {
  const auth = await requirePermission("clients.edit");
  if (auth.error) throw new Error("Forbidden");
  return mutations.updateClient(auth.supabase, id, payload);
}

export async function softDeleteClient(id: string): Promise<void> {
  const auth = await requirePermission("clients.delete");
  if (auth.error) throw new Error("Forbidden");
  return mutations.softDeleteClient(auth.supabase, id);
}
