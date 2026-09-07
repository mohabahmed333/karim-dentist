import { createClient } from "@/lib/supabase/client";
import {
  fileExtension,
  mapStorageUploadError,
} from "@/lib/supabase/uploadHelpers";

export type StorageBucket =
  | "hero"
  | "about"
  | "projects"
  | "clients"
  | "patient-records";

export async function uploadPublicMedia(
  bucket: StorageBucket,
  file: File,
  folder = "uploads",
): Promise<string> {
  const supabase = createClient();
  const ext = fileExtension(file.name) || "bin";
  const path = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw mapStorageUploadError(error);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
