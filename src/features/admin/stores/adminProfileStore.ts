"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

export type CurrentProfile = {
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
};

type AdminProfileState = {
  profile: CurrentProfile | null;
  loading: boolean;
  fetched: boolean;
  /** Idempotent — safe to call from every mount that needs the profile; only
   *  the first caller actually hits Supabase, the rest share the same state. */
  ensureFetched: () => void;
  update: (patch: Partial<CurrentProfile>) => void;
};

export const useAdminProfileStore = create<AdminProfileState>((set, get) => ({
  profile: null,
  loading: false,
  fetched: false,
  ensureFetched: () => {
    if (get().fetched || get().loading) return;
    set({ loading: true });
    const supabase = createClient();
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        set({ loading: false, fetched: true });
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      set({
        profile: {
          name: data?.display_name ?? null,
          email: user.email ?? null,
          avatarUrl: data?.avatar_url ?? null,
        },
        loading: false,
        fetched: true,
      });
    })();
  },
  update: (patch) =>
    set((state) => (state.profile ? { profile: { ...state.profile, ...patch } } : state)),
}));
