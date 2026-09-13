import { requirePagePermission } from "@/lib/auth/pageGuard";

export default async function CaseStudyBuilderPage() {
  await requirePagePermission("customize.view");
  return null;
}
