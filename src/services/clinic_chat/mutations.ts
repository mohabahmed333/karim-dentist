import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/database.types";
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
