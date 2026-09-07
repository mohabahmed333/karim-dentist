import { ContactEditor } from "@/features/admin/components/ContactEditor";
import { createClient } from "@/lib/supabase/server";
import { portfolioFallback } from "@/services/portfolio/fallback";

export const dynamic = "force-dynamic";

export default async function AdminContactPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("*").limit(1).maybeSingle();

  return <ContactEditor settings={data ?? portfolioFallback.settings} />;
}
