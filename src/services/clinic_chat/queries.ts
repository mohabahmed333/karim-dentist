import { createClient } from "@/lib/supabase/client";
import type { ClinicChatThread } from "./types";
import { SESSION_THREAD_KIND } from "./types";

export type ClinicChatThreadSummary = ClinicChatThread & {
  message_count: number;
  preview: string | null;
};

/** The signed-in admin's id, or null (defensive — every caller here is behind admin auth). */
async function currentUserId(
  supabase: ReturnType<typeof createClient>,
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function listThreads(): Promise<ClinicChatThread[]> {
  const supabase = createClient();
  const userId = await currentUserId(supabase);
  let query = supabase
    .from("clinic_chat_threads")
    .select("*")
    .order("updated_at", { ascending: false });
  if (userId) query = query.eq("created_by", userId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/**
 * Sessions with a short preview for the History tab.
 *
 * Scoped to the signed-in admin: RLS lets any admin read the whole table
 * (needed for the AI's own audit trail elsewhere), so without this filter
 * one admin's History list showed every admin's chats, and their Confirm
 * buttons on each other's pending proposals — created_by on the proposal
 * table, not the thread — quietly failed with "not found".
 */
export async function listThreadSummaries(): Promise<ClinicChatThreadSummary[]> {
  const supabase = createClient();
  const userId = await currentUserId(supabase);
  let query = supabase
    .from("clinic_chat_threads")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(50);
  if (userId) query = query.eq("created_by", userId);
  const { data: threads, error } = await query;
  if (error) throw error;
  if (!threads?.length) return [];

  const ids = threads.map((t) => t.id);
  const { data: messages, error: msgError } = await supabase
    .from("clinic_chat_messages")
    .select("thread_id, role, content, created_at")
    .in("thread_id", ids)
    .order("created_at", { ascending: false });
  if (msgError) throw msgError;

  const countByThread = new Map<string, number>();
  const previewByThread = new Map<string, string>();
  for (const row of messages ?? []) {
    countByThread.set(
      row.thread_id,
      (countByThread.get(row.thread_id) ?? 0) + 1,
    );
    if (
      !previewByThread.has(row.thread_id) &&
      row.role === "user" &&
      row.content.trim()
    ) {
      previewByThread.set(row.thread_id, row.content.trim().slice(0, 80));
    }
  }

  return threads.map((t) => ({
    ...t,
    message_count: countByThread.get(t.id) ?? 0,
    preview: previewByThread.get(t.id) ?? null,
  }));
}

/** Always start a new session (fresh chat on refresh / New chat). */
export async function createSessionThread(
  title = "Reception chat",
): Promise<ClinicChatThread> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("clinic_chat_threads")
    .insert({
      title,
      kind: SESSION_THREAD_KIND,
      created_by: user?.id ?? null,
      context: {},
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/** How long an idle session is still worth resuming rather than starting fresh. */
const RESUMABLE_WITHIN_MS = 24 * 60 * 60 * 1000;

/** Pure so the boundary is testable without a database. */
export function isRecentEnoughToResume(
  updatedAt: string,
  now: Date = new Date(),
): boolean {
  return now.getTime() - new Date(updatedAt).getTime() <= RESUMABLE_WITHIN_MS;
}

/**
 * The signed-in admin's own most recent chat, if it's from today-ish.
 *
 * Without this, opening the panel always inserted a fresh thread (plus its
 * welcome message) — a full page load, a route change with the panel
 * remounted, anything — so a five-minute-old conversation was gone the
 * moment staff navigated to a different admin page and came back.
 */
export async function findResumableThread(): Promise<ClinicChatThread | null> {
  const supabase = createClient();
  const userId = await currentUserId(supabase);
  if (!userId) return null;

  const { data, error } = await supabase
    .from("clinic_chat_threads")
    .select("*")
    .eq("kind", SESSION_THREAD_KIND)
    .eq("created_by", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return isRecentEnoughToResume(data.updated_at) ? data : null;
}

/** @deprecated use createSessionThread — kept for callers that still import it */
export async function getOrCreateHomeThread(): Promise<ClinicChatThread> {
  return createSessionThread();
}

export async function touchThread(threadId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("clinic_chat_threads")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", threadId);
  if (error) throw error;
}

export async function updateThreadContext(
  threadId: string,
  context: import("./types").ClinicChatThreadContext,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("clinic_chat_threads")
    .update({
      context: context as import("@/lib/supabase/database.types").Json,
      updated_at: new Date().toISOString(),
    })
    .eq("id", threadId);
  if (error) throw error;
}

export async function renameThread(
  threadId: string,
  title: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("clinic_chat_threads")
    .update({
      title: title.slice(0, 80),
      updated_at: new Date().toISOString(),
    })
    .eq("id", threadId);
  if (error) throw error;
}
