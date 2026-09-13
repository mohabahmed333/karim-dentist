import { FooterLinksEditor } from "@/features/admin/components/FooterLinksEditor";
import { createClient } from "@/lib/supabase/server";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export const dynamic = "force-dynamic";

export default async function AdminFooterLinksPage() {
  await requirePagePermission("footer-links.view");
  const supabase = await createClient();
  const { data } = await supabase
    .from("footer_links")
    .select("*")
    .is("deleted_at", null)
    .order("column_key", { ascending: true })
    .order("sort_order", { ascending: true });

  return <FooterLinksEditor items={data ?? []} />;
}
