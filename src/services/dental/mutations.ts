import { createClient } from "@/lib/supabase/client";
import type {
  GalleryComparison,
  GalleryItem,
  GalleryShowcase,
  SolutionPanel,
  TrustItem,
} from "./types";

const supabase = () => createClient();

export async function upsertGalleryShowcase(
  showcase: GalleryShowcase | null,
  partial: Partial<GalleryShowcase>,
): Promise<GalleryShowcase> {
  const payload = {
    image_url: partial.image_url ?? showcase?.image_url ?? "",
    alt_text: partial.alt_text ?? showcase?.alt_text ?? "",
  };
  if (showcase?.id) {
    const { data, error } = await supabase()
      .from("gallery_showcase")
      .update(payload)
      .eq("id", showcase.id)
      .select()
      .single();
    if (error) throw error;
    return data as GalleryShowcase;
  }
  const { data, error } = await supabase()
    .from("gallery_showcase")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as GalleryShowcase;
}

export async function createGalleryItem(
  partial: Partial<GalleryItem> & { sort_order: number },
): Promise<GalleryItem> {
  const { data, error } = await supabase()
    .from("gallery_items")
    .insert({
      image_url: partial.image_url ?? "",
      caption: partial.caption ?? "",
      category: partial.category ?? "clinic",
      sort_order: partial.sort_order,
      is_published: partial.is_published ?? true,
    })
    .select()
    .single();
  if (error) throw error;
  return data as GalleryItem;
}

export async function updateGalleryItem(
  id: string,
  partial: Partial<GalleryItem>,
): Promise<GalleryItem> {
  const { data, error } = await supabase()
    .from("gallery_items")
    .update(partial)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as GalleryItem;
}

export async function deleteGalleryItem(id: string): Promise<void> {
  const { error } = await supabase().from("gallery_items").delete().eq("id", id);
  if (error) throw error;
}

export async function updateTrustItem(
  id: string,
  partial: Partial<TrustItem>,
): Promise<TrustItem> {
  const { data, error } = await supabase()
    .from("about_trust_items")
    .update(partial)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as TrustItem;
}

export async function updateSolutionPanel(
  id: string,
  partial: Partial<SolutionPanel>,
): Promise<SolutionPanel> {
  const { data, error } = await supabase()
    .from("solution_panels")
    .update(partial)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as SolutionPanel;
}

export async function createGalleryComparison(
  partial: Partial<GalleryComparison> & { sort_order: number },
): Promise<GalleryComparison> {
  const { data, error } = await supabase()
    .from("gallery_comparisons")
    .insert({
      before_image_url: partial.before_image_url ?? "",
      after_image_url: partial.after_image_url ?? "",
      alt_text: partial.alt_text ?? "",
      sort_order: partial.sort_order,
      is_published: partial.is_published ?? true,
    })
    .select()
    .single();
  if (error) throw error;
  return data as GalleryComparison;
}

export async function updateGalleryComparison(
  id: string,
  partial: Partial<GalleryComparison>,
): Promise<GalleryComparison> {
  const { data, error } = await supabase()
    .from("gallery_comparisons")
    .update(partial)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as GalleryComparison;
}

export async function deleteGalleryComparison(id: string): Promise<void> {
  const { error } = await supabase()
    .from("gallery_comparisons")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
