import { z } from "zod";

/** content is rich HTML (RichTextEditor), so "empty" means no visible text
 * and no image — not just an empty string (e.g. "<p></p>" from a cleared
 * editor, or a lone image with no caption, which should still count). */
export function hasMeaningfulContent(html: string): boolean {
  if (/<img\b/i.test(html)) return true;
  return html.replace(/<[^>]*>/g, "").trim().length > 0;
}

export const adminNoteContentSchema = z.object({
  content: z
    .string()
    .max(10000)
    .refine(hasMeaningfulContent, "Note can't be empty"),
});

export type AdminNoteContentValues = z.infer<typeof adminNoteContentSchema>;
