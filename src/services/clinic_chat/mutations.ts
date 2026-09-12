import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/database.types";
import { mergeMeta } from "./mergeMeta";
import { touchThread } from "./queries";
import type {
  ClinicChatMessage,
  ClinicChatMessageMeta,
} from "./types";
import { WELCOME_ACTIONS, WELCOME_CONTENT } from "./types";

export async function listMessages(
  threadId: string,
): Promise<ClinicChatMessage[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clinic_chat_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function appendMessage(input: {
  threadId: string;
  role: "user" | "assistant" | "system";
  content: string;
  meta?: ClinicChatMessageMeta;
}): Promise<ClinicChatMessage> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clinic_chat_messages")
    .insert({
      thread_id: input.threadId,
      role: input.role,
      content: input.content,
      meta: (input.meta ?? {}) as Json,
    })
    .select("*")
    .single();
  if (error) throw error;
  await touchThread(input.threadId);
  return data;
}

/** Merge fields into a message's meta (e.g. staff feedback) without touching its content. */
export async function updateMessageMeta(
  messageId: string,
  patch: Partial<ClinicChatMessageMeta>,
): Promise<void> {
  const supabase = createClient();
  const { data: existing, error: readError } = await supabase
    .from("clinic_chat_messages")
    .select("meta")
    .eq("id", messageId)
    .maybeSingle();
  if (readError) throw readError;
  const merged = mergeMeta(existing?.meta as ClinicChatMessageMeta | null, patch);
  const { error } = await supabase
    .from("clinic_chat_messages")
    .update({ meta: merged as Json })
    .eq("id", messageId);
  if (error) throw error;
}

/** Remove one message — used by "regenerate" to drop the stale reply before re-asking. */
export async function deleteMessage(messageId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("clinic_chat_messages")
    .delete()
    .eq("id", messageId);
  if (error) throw error;
}

export async function seedWelcome(
  threadId: string,
  options?: {
    content?: string;
    actions?: { id: string; label: string }[];
  },
): Promise<ClinicChatMessage> {
  return appendMessage({
    threadId,
    role: "assistant",
    content: options?.content ?? WELCOME_CONTENT,
    meta: {
      actions: options?.actions ?? [...WELCOME_ACTIONS],
    },
  });
}

/** Wipe messages on this thread and seed welcome (does not delete the thread). */
export async function clearThread(
  threadId: string,
  options?: {
    content?: string;
    actions?: { id: string; label: string }[];
    title?: string;
  },
): Promise<ClinicChatMessage> {
  const supabase = createClient();
  const { error: delError } = await supabase
    .from("clinic_chat_messages")
    .delete()
    .eq("thread_id", threadId);
  if (delError) throw delError;
  await supabase
    .from("clinic_chat_threads")
    .update({
      context: {},
      title: options?.title ?? "Reception chat",
      updated_at: new Date().toISOString(),
    })
    .eq("id", threadId);
  return seedWelcome(threadId, options);
}
