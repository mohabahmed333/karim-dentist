import { z } from "zod";

export const adminNoteContentSchema = z.object({
  content: z.string().trim().min(1, "Note can't be empty").max(2000),
});

export type AdminNoteContentValues = z.infer<typeof adminNoteContentSchema>;
