import { AdminShell } from "@/features/admin/components/AdminShell";
import { Toaster } from "@/components/ui/sonner";
import { createClient } from "@/lib/supabase/server";
import { resolveSessionPermissions } from "@/lib/auth/permissions";
import {
  DEFAULT_DASHBOARD_CANVAS,
  DEFAULT_DASHBOARD_PRIMARY,
  DEFAULT_DASHBOARD_SECONDARY,
  normalizeHexColor,
} from "@/services/site_settings/dashboardTheme";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import {
  loadAdminNotificationCounts,
  visibleNotificationGroups,
} from "@/services/admin_notifications";

export const dynamic = "force-dynamic";

async function loadAdminChrome() {
  const supabase = await createClient();
  const [{ count }, { count: unbilled }, settings] = await Promise.all([
    supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .is("deleted_at", null),
    // Bills a doctor has sent that the front desk has not settled yet. Without
    // this the queue at /admin/billing is only found by going to look at it.
    supabase
      .from("treatment_proposals")
      .select("id", { count: "exact", head: true })
      .eq("status", "sent"),
    supabase
      .from("site_settings")
      .select(
        "dashboard_primary_color, dashboard_secondary_color, dashboard_canvas_color, dashboard_panel_color",
      )
      .limit(1)
      .maybeSingle(),
  ]);
  return {
    navBadges: {
      "/admin/reservations": count ?? 0,
      "/admin/billing": unbilled ?? 0,
    } as Record<string, number>,
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
    navBadges: {} as Record<string, number>,
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

  const supabase = await createClient();
  const session = await resolveSessionPermissions(supabase);

  // The bell's contents, resolved once per navigation next to the nav badges.
  // Filtered here rather than in the client so a count nobody may act on never
  // reaches the browser.
  const notificationCounts = await loadAdminNotificationCounts(supabase).catch(
    () => ({}),
  );
  const notifications = visibleNotificationGroups(
    notificationCounts,
    session.permissions,
  );

  return (
    <NuqsAdapter>
      <AdminShell
        navBadges={chrome.navBadges}
        primaryColor={chrome.primaryColor}
        secondaryColor={chrome.secondaryColor}
        canvasColor={chrome.canvasColor}
        contentColor={chrome.contentColor}
        permissions={[...session.permissions]}
        notifications={notifications}
      >
        {children}
      </AdminShell>
      <Toaster />
    </NuqsAdapter>
  );
}
