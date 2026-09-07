"use client";

import { useEffect, useState } from "react";
import {
  ADMIN_THEME_EVENT,
  FALLBACK_ADMIN_THEME,
  readAdminThemeVars,
  type AdminThemeVars,
} from "@/features/admin/lib/adminThemeVars";

/** Keep portal UIs in sync with `.admin-shell` theme tokens. */
export function useAdminThemeVars(active = true): AdminThemeVars {
  const [vars, setVars] = useState<AdminThemeVars>(FALLBACK_ADMIN_THEME);

  useEffect(() => {
    function sync() {
      setVars(readAdminThemeVars());
    }
    sync();
    window.addEventListener(ADMIN_THEME_EVENT, sync);
    return () => window.removeEventListener(ADMIN_THEME_EVENT, sync);
  }, []);

  useEffect(() => {
    if (active) setVars(readAdminThemeVars());
  }, [active]);

  return vars;
}
