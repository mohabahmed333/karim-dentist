import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

function fileExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : "";
}

/** Scoped by conversation so a chat's media stays easy to find/prune. */
export function buildWhatsappMediaPath(
  conversationId: string,
  fileName: string,
  now: number = Date.now(),
  rand: string = crypto.randomUUID().slice(0, 8),
): string {
  const ext = fileExtension(fileName) || "bin";
  return `whatsapp/${conversationId}/${now}-${rand}.${ext}`;
}

/**
 * Kapso's send APIs return a Meta media id, not a durable URL — the id-based
 * fetch URL Meta offers expires in minutes and needs the access token, so it
 * can't back an inbox bubble after a page reload. Mirror the file into our
 * own public storage so sent media stays viewable indefinitely.
 */
export async function uploadWhatsappMediaFile(
  service: SupabaseClient<Database>,
  conversationId: string,
  file: File | Blob,
  mime: string,
  fileName: string,
): Promise<string> {
  const path = buildWhatsappMediaPath(conversationId, fileName);
  const { error } = await service.storage
    .from("patient-records")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: mime || undefined,
    });
  if (error) throw new Error(error.message);
  const { data } = service.storage.from("patient-records").getPublicUrl(path);
  return data.publicUrl;
}
