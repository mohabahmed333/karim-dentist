import { requirePagePermission } from "@/lib/auth/pageGuard";

export default async function CustomizeItemPage() {
  await requirePagePermission("customize.view");
  return null;
}
