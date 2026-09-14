import { redirect } from "next/navigation";

/**
 * Settings is a sidebar group, not a page.
 *
 * The dashboard theme lived here, which made "Settings" in the sidebar a link
 * to one of its own children — clicking the group to open it navigated away
 * instead. The theme now has its own route like every other settings page, and
 * this path only forwards the bookmarks that still point at it.
 */
export default function AdminSettingsPage() {
  redirect("/admin/settings/theme");
}
