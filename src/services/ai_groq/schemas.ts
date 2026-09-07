import { z } from "zod";

export const treatmentAiDraftSchema = z.object({
  cdt_code: z.string().optional().default(""),
  fee_amount: z.coerce.number().int().min(0).optional().default(0),
  severity: z.enum(["Minor", "Critical"]).optional().default("Minor"),
  last_treatment: z.string().optional().default(""),
  ai_title: z.string().optional().default(""),
  ai_description: z.string().optional().default(""),
  ai_confidence: z.string().optional().default(""),
  ai_recommendation: z.string().optional().default(""),
  appointment: z
    .object({
      book: z.boolean().optional().default(false),
      service_label: z.string().optional().default(""),
      notes: z.string().optional().default(""),
    })
    .optional(),
});

type RawPollOption = {
  id?: unknown;
  label?: unknown;
  value?: unknown;
};

function normalizePollOptions(value: unknown): RawPollOption[] {
  if (!Array.isArray(value)) return [];
  const out: RawPollOption[] = [];
  for (const [index, row] of value.slice(0, 8).entries()) {
    if (!row || typeof row !== "object") continue;
    const item = row as RawPollOption;
    const label = String(item.label ?? "").trim();
    const rawValue = String(item.value ?? "").trim();
    const id = String(item.id ?? "").trim() || `opt-${index + 1}`;
    const resolved = rawValue || label;
    if (!label || !resolved) continue;
    out.push({ id, label, value: resolved });
  }
  return out;
}

export const treatmentAiPollSchema = z.preprocess((raw) => {
  if (raw == null) return null;
  if (typeof raw !== "object") return null;
  const poll = raw as Record<string, unknown>;
  const options = normalizePollOptions(poll.options);
  if (options.length === 0) return null;
  return { ...poll, options };
}, z
  .object({
    id: z.string().min(1),
    kind: z.enum([
      "cdt",
      "severity",
      "appointment",
      "slot",
      "confirm",
      "generic",
    ]),
    question: z.string().min(1),
    options: z
      .array(
        z.object({
          id: z.string().min(1),
          label: z.string().min(1),
          value: z.string().min(1),
        }),
      )
      .min(1)
      .max(8),
  })
  .nullable());

export const treatmentAiResponseSchema = z.object({
  reply: z.string().min(1),
  draft: treatmentAiDraftSchema.optional(),
  poll: treatmentAiPollSchema.optional(),
  choices: z.array(treatmentAiDraftSchema).max(5).optional().default([]),
  proposedActions: z
    .array(
      z.object({
        id: z.string().min(1).max(80),
        kind: z.string().min(1).max(80),
        label: z.string().min(1).max(160),
        dependsOn: z.array(z.string()).max(20).optional().default([]),
        payload: z.record(z.string(), z.unknown()).default({}),
      }),
    )
    .max(40)
    .optional()
    .default([]),
});

export type TreatmentAiDraft = z.infer<typeof treatmentAiDraftSchema>;
export type TreatmentAiPoll = NonNullable<z.infer<typeof treatmentAiPollSchema>>;
export type TreatmentAiResponse = z.infer<typeof treatmentAiResponseSchema>;
