"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import type { Hero, HeroUpdate } from "./types";
import * as mutations from "./mutations";

export async function updateHero(id: string, payload: HeroUpdate): Promise<Hero> {
  const auth = await requirePermission("hero.edit");
  if (auth.error) throw new Error("Forbidden");
  return mutations.updateHero(auth.supabase, id, payload);
}
