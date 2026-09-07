import type { SupabaseClient } from "@supabase/supabase-js";
import type { StorageBucket } from "@/lib/supabase/upload";

const PAGE = 100;

type Listed = {
  id: string | null;
  name: string;
  metadata?: { size?: number } | null;
};

export async function sumBucketBytes(
  supabase: SupabaseClient,
  bucket: string,
  prefix = "",
): Promise<number> {
  let offset = 0;
  let total = 0;
  for (;;) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: PAGE,
      offset,
    });
    if (error) throw error;
    const rows = (data ?? []) as Listed[];
    if (!rows.length) break;
    for (const item of rows) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id == null) {
        total += await sumBucketBytes(supabase, bucket, path);
      } else {
        total += Number(item.metadata?.size ?? 0);
      }
    }
    if (rows.length < PAGE) break;
    offset += PAGE;
  }
  return total;
}

export async function sumBucketsBytes(
  supabase: SupabaseClient,
  buckets: readonly StorageBucket[],
): Promise<number> {
  let total = 0;
  for (const bucket of buckets) {
    total += await sumBucketBytes(supabase, bucket);
  }
  return total;
}
