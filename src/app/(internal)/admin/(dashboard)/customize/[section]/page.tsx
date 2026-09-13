import { requirePagePermission } from "@/lib/auth/pageGuard";

export default async function CustomizeSectionPage() {
  await requirePagePermission("customize.view");
  return null;
}
