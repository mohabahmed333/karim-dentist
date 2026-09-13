"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type CurrentProfile = {
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
};

/**
 * The signed-in user's name/photo for the admin chrome.
 *
 * Resolved client-side rather than threaded down from the dashboard layout so
 * the account menu stays self-contained — the alternative is passing a user
 * prop through AdminShell and every nav component that renders the menu.
 */
export function useCurrentProfile(): CurrentProfile | null {
  const [profile, setProfile] = useState<CurrentProfile | null>(null);

  useEffect(() => {
    let alive = true;
    const supabase = createClient();

    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!alive || !user) return;

      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (!alive) return;

      setProfile({
        name: data?.display_name ?? null,
        email: user.email ?? null,
        avatarUrl: data?.avatar_url ?? null,
      });
    })();

    return () => {
      alive = false;
    };
  }, []);

  return profile;
}
