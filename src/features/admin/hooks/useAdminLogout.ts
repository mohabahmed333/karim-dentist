"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ADMIN_LOGIN_PATH,
  signOutAdminSession,
} from "@/features/admin/lib/signOutAdmin";
import { useTranslations } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

export function useAdminLogout() {
  const t = useTranslations();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const logout = useCallback(async () => {
    setPending(true);
    try {
      const supabase = createClient();
      const result = await signOutAdminSession(() => supabase.auth.signOut());
      if (!result.ok) {
        toast.error(t("admin.settings.logoutFailed"));
        return;
      }
      toast.success(t("admin.settings.loggedOut"));
      router.replace(ADMIN_LOGIN_PATH);
      router.refresh();
    } catch {
      toast.error(t("admin.settings.logoutFailed"));
    } finally {
      setPending(false);
    }
  }, [router, t]);

  return { logout, pending };
}
