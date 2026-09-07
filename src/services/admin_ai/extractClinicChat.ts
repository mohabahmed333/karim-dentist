import { z } from "zod";
import { proposedActionSchema } from "@/services/admin_ai/schemas";

const chipSchema = z.object({
  id: z.string().min(1).max(80),
  label: z.string().min(1).max(80),
  payload: z.record(z.string(), z.string()).optional(),
});

export function extractClinicChatPayload(
  raw: string,
  defaults: z.infer<typeof chipSchema>[],
): {
  reply: string;
  suggestedActions: z.infer<typeof chipSchema>[];
  proposedActions: z.infer<typeof proposedActionSchema>[];
} {
  const fence = raw.match(/```json\s*([\s\S]*?)```/i);
  if (fence?.[1]) {
    try {
      const parsed = JSON.parse(fence[1]) as {
        reply?: string;
        suggestedActions?: unknown;
        proposedActions?: unknown;
      };
      const chips = z.array(chipSchema).safeParse(parsed.suggestedActions);
      const proposed = z
        .array(proposedActionSchema)
        .safeParse(parsed.proposedActions ?? []);
      return {
        reply: (parsed.reply ?? raw.replace(fence[0], "").trim()) || raw,
        suggestedActions: chips.success ? chips.data : defaults,
        proposedActions: proposed.success ? proposed.data : [],
      };
    } catch {
      /* fall through */
    }
  }
  return {
    reply: raw.trim(),
    suggestedActions: defaults,
    proposedActions: [],
  };
}
