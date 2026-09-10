import { createClient } from "@supabase/supabase-js";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  SERVICE_ROLE_KEY,
  SUPABASE_URL,
  VIEWER_EMAIL,
  VIEWER_PASSWORD,
} from "./env";

export function serviceClient() {
  if (!SERVICE_ROLE_KEY) {
    throw new Error(
      "E2E_SUPABASE_SERVICE_ROLE_KEY is required — get it from `supabase status`",
    );
  }
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

async function ensureUser(
  db: ReturnType<typeof serviceClient>,
  email: string,
  password: string,
  role: "admin" | "viewer",
) {
  const { data: list } = await db.auth.admin.listUsers();
  let user = list?.users.find((u) => u.email === email) ?? null;
  if (!user) {
    const { data, error } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    user = data.user;
  }
  // profiles.role is what public.is_admin() reads; a viewer row is what proves
  // the authorization fix works.
  await db.from("profiles").upsert(
    { id: user!.id, role, display_name: role, deleted_at: null },
    { onConflict: "id" },
  );
  return user!;
}

/** Idempotent fixture set: two users, clinic facts, and open slots. */
export async function seedE2E() {
  const db = serviceClient();

  await ensureUser(db, ADMIN_EMAIL, ADMIN_PASSWORD, "admin");
  await ensureUser(db, VIEWER_EMAIL, VIEWER_PASSWORD, "viewer");

  const { data: settings } = await db
    .from("site_settings")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (settings) {
    await db
      .from("site_settings")
      .update({
        contact_clinic_name: "The Dental Lounge",
        contact_phone: "+201000000000",
        contact_address: "Road 90, New Cairo",
      })
      .eq("id", settings.id);
  }

  // A handful of open slots in the future, well clear of "now".
  const base = new Date();
  base.setDate(base.getDate() + 2);
  base.setHours(10, 0, 0, 0);
  const slots = Array.from({ length: 4 }, (_, i) => {
    const startsAt = new Date(base.getTime() + i * 60 * 60_000);
    return {
      starts_at: startsAt.toISOString(),
      ends_at: new Date(startsAt.getTime() + 60 * 60_000).toISOString(),
      status: "open" as const,
    };
  });
  for (const slot of slots) {
    const { data: existing } = await db
      .from("appointment_slots")
      .select("id")
      .eq("starts_at", slot.starts_at)
      .maybeSingle();
    if (!existing) await db.from("appointment_slots").insert(slot);
  }

  return { slots };
}

/** Put the responder into a known mode for a spec. */
export async function setAiMode(
  mode: "off" | "draft_only" | "auto",
  extra: Record<string, unknown> = {},
) {
  const db = serviceClient();
  const { data } = await db
    .from("whatsapp_ai_settings")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (!data) return;
  await db
    .from("whatsapp_ai_settings")
    .update({ mode, ...extra })
    .eq("id", data.id);
}

export async function conversationByPhone(phone: string) {
  const db = serviceClient();
  const { data } = await db
    .from("whatsapp_conversations")
    .select("id")
    .eq("phone_number", phone)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function messagesFor(conversationId: string) {
  const db = serviceClient();
  const { data } = await db
    .from("whatsapp_messages")
    .select("id,body,direction,status,sender_kind,wa_timestamp")
    .eq("conversation_id", conversationId)
    .order("wa_timestamp", { ascending: true });
  return data ?? [];
}
