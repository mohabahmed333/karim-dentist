import { createClient } from "@/lib/supabase/client";
import type { ClinicChatThread } from "./types";
import { SESSION_THREAD_KIND } from "./types";

export type ClinicChatThreadSummary = ClinicChatThread & {
  message_count: number;
  preview: string | null;
};

export async function listThreads(): Promise<ClinicChatThread[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clinic_chat_threads")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Sessions with a short preview for the History tab. */
export async function listThreadSummaries(): Promise<ClinicChatThreadSummary[]> {
  const supabase = createClient();
  const { data: threads, error } = await supabase
    .from("clinic_chat_threads")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(50);
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
