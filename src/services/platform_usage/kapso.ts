import { createServiceClient } from "@/lib/supabase/service";
import { utcMonthStartIso } from "./month";

export async function countKapsoMessages(): Promise<number | null> {
  try {
    const supabase = createServiceClient();
    const { count, error } = await supabase
      .from("whatsapp_messages")
      .select("id", { count: "exact", head: true })
      .gte("wa_timestamp", utcMonthStartIso());
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}
