import { GalleryEditor } from "@/features/admin/components/GalleryEditor";
import { createClient } from "@/lib/supabase/server";
import { dentalGalleryComparisonsFallback } from "@/services/dental/fallback";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const supabase = await createClient();
  const comparisons = await supabase
    .from("gallery_comparisons")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <GalleryEditor
      comparisons={
        comparisons.data && comparisons.data.length > 0
          ? comparisons.data
          : dentalGalleryComparisonsFallback
      }
    />
  );
}
