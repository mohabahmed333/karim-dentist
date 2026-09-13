"use client";

import { useEffect } from "react";
import { useAdminProfileStore, type CurrentProfile } from "@/features/admin/stores/adminProfileStore";

export type { CurrentProfile };

/**
 * The signed-in user's name/photo for the admin chrome, backed by the shared
 * profile store — every mount reads the same fetched-once record and updates
 * together the moment ProfileForm saves a change, with no event wiring.
 */
export function useCurrentProfile(): CurrentProfile | null {
  const profile = useAdminProfileStore((state) => state.profile);
  const ensureFetched = useAdminProfileStore((state) => state.ensureFetched);

  useEffect(() => {
    ensureFetched();
  }, [ensureFetched]);

  return profile;
}
