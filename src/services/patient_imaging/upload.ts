import { createClient } from "@/lib/supabase/client";
import {
  fileExtension,
  inferMediaContentType,
  mapStorageUploadError,
} from "@/lib/supabase/uploadHelpers";

function sanitizeKey(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "_");
}

export async function uploadPatientImagingFile(
  patientKey: string,
  file: File,
): Promise<{ file_url: string; file_name: string; mime_type: string }> {
  const supabase = createClient();
  const ext = fileExtension(file.name) || "bin";
  const mime = inferMediaContentType(file) ?? file.type ?? "application/octet-stream";
  const path = `imaging/${sanitizeKey(patientKey)}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from("patient-records")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: mime,
    });
  if (error) throw mapStorageUploadError(error);

  const { data } = supabase.storage.from("patient-records").getPublicUrl(path);
  return {
    file_url: data.publicUrl,
    file_name: file.name,
    mime_type: mime,
  };
}
