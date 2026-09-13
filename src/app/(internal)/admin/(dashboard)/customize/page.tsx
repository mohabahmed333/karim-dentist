import { redirect } from "next/navigation";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export default async function CustomizeIndexPage() {
  await requirePagePermission("customize.view");
  redirect("/admin/customize/hero");
}
