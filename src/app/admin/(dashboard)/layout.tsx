import { AdminShell } from "@/features/admin/components/AdminShell";
import { Toaster } from "@/components/ui/sonner";
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_DASHBOARD_CANVAS,
  DEFAULT_DASHBOARD_PRIMARY,
  DEFAULT_DASHBOARD_SECONDARY,
  normalizeHexColor,
} from "@/services/site_settings/dashboardTheme";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export const dynamic = "force-dynamic";

async function loadAdminChrome() {
  const supabase = await createClient();
  const [{ count }, settings] = await Promise.all([
    supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .is("deleted_at", null),
    supabase
      .from("site_settings")
      .select(
        "dashboard_primary_color, dashboard_secondary_color, dashboard_canvas_color, dashboard_panel_color",
      )
      .limit(1)
      .maybeSingle(),
  ]);
  return {
    pendingCount: count ?? 0,
    primaryColor: normalizeHexColor(
      settings.data?.dashboard_primary_color,
      DEFAULT_DASHBOARD_PRIMARY,
    ),
    secondaryColor: normalizeHexColor(
      settings.data?.dashboard_secondary_color,
      DEFAULT_DASHBOARD_SECONDARY,
    ),
    canvasColor: normalizeHexColor(
      settings.data?.dashboard_canvas_color,
      DEFAULT_DASHBOARD_CANVAS,
    ),
    contentColor: normalizeHexColor(
      settings.data?.dashboard_panel_color,
      DEFAULT_DASHBOARD_CANVAS,
    ),
  };
}

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let chrome = {
    pendingCount: 0,
    primaryColor: DEFAULT_DASHBOARD_PRIMARY,
    secondaryColor: DEFAULT_DASHBOARD_SECONDARY,
    canvasColor: DEFAULT_DASHBOARD_CANVAS,
    contentColor: DEFAULT_DASHBOARD_CANVAS,
  };
  try {
    chrome = await loadAdminChrome();
  } catch {
    /* keep defaults */
  }

  return (
    <NuqsAdapter>
      <AdminShell
        pendingCount={chrome.pendingCount}
        primaryColor={chrome.primaryColor}
        secondaryColor={chrome.secondaryColor}
        canvasColor={chrome.canvasColor}
        contentColor={chrome.contentColor}
      >
        {children}
      </AdminShell>
      <Toaster />
    </NuqsAdapter>
  );
}
