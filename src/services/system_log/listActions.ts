import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { isRevertible } from "./revertPolicy";

export type SystemActionOperation = "insert" | "update" | "delete";

export type SystemActionRow = {
  id: string;
  table_name: string;
  row_id: string;
  operation: SystemActionOperation;
  actor_id: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  created_at: string;
  reverted_at: string | null;
  reverted_by: string | null;
  revertible: boolean;
};

const DEFAULT_LIMIT = 20;

/**
 * Read-only, cursor-paginated history for /admin/system-log — every tracked
 * write, newest first. `revertible` is computed here from revertPolicy.ts
 * (not trusted from a stored flag), so that stays the single source of truth.
 */
export async function listSystemActions(
  db: SupabaseClient<Database>,
  opts: {
    table?: string;
    operation?: SystemActionOperation;
    cursor?: string;
    limit?: number;
  },
): Promise<{ rows: SystemActionRow[]; nextCursor: string | null }> {
  const limit = opts.limit ?? DEFAULT_LIMIT;

  let query = db
    .from("system_action_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit + 1);
  if (opts.table) query = query.eq("table_name", opts.table);
  if (opts.operation) query = query.eq("operation", opts.operation);
  if (opts.cursor) query = query.lt("created_at", opts.cursor);

  const { data, error } = await query;
  if (error) throw error;

  const entries = data ?? [];
  const hasMore = entries.length > limit;
  const page = hasMore ? entries.slice(0, limit) : entries;
  const nextCursor = hasMore ? page[page.length - 1].created_at : null;

  const rows: SystemActionRow[] = page.map((row) => ({
    id: row.id,
    table_name: row.table_name,
    row_id: row.row_id,
    operation: row.operation,
    actor_id: row.actor_id,
    before: (row.before ?? null) as Record<string, unknown> | null,
    after: (row.after ?? null) as Record<string, unknown> | null,
    created_at: row.created_at,
    reverted_at: row.reverted_at,
    reverted_by: row.reverted_by,
    revertible: isRevertible(row.table_name) && !row.reverted_at,
  }));

  return { rows, nextCursor };
}
