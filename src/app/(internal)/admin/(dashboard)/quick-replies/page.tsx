import { QuickRepliesEditor } from "@/features/admin/components/quick-replies/QuickRepliesEditor";
import { createClient } from "@/lib/supabase/server";
import { listCannedReplies } from "@/services/whatsapp/cannedReplies";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export const dynamic = "force-dynamic";

export default async function AdminQuickRepliesPage() {
  await requirePagePermission("quick-replies.view");
  const supabase = await createClient();
  const items = await listCannedReplies(supabase, { activeOnly: false });
  return <QuickRepliesEditor items={items} />;
}
