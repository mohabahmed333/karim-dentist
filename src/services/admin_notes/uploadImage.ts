import { createClient } from "@/lib/supabase/client";
import {
  fileExtension,
  inferMediaContentType,
  mapStorageUploadError,
} from "@/lib/supabase/uploadHelpers";

/** Uploads an image pasted/dropped into a team note; returns its public URL. */
export async function uploadAdminNoteImage(file: File): Promise<string> {
  const supabase = createClient();
  const ext = fileExtension(file.name) || "png";
  const mime = inferMediaContentType(file) ?? file.type ?? "image/png";
  const path = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from("team-notes")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: mime,
    });
  if (error) throw mapStorageUploadError(error);

  const { data } = supabase.storage.from("team-notes").getPublicUrl(path);
  return data.publicUrl;
}
