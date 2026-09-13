import { requirePagePermission } from "@/lib/auth/pageGuard";

export default async function FeaturedBuilderPage() {
  await requirePagePermission("customize.view");
  return null;
}
