import { z } from "zod";

export const FDI_ACTION_PATTERN = /^([1-4][1-8]|[5-8][1-5])$/;

export const fdiSchema = z
  .string()
  .regex(FDI_ACTION_PATTERN, "Invalid FDI tooth number");

export const actionKindSchema = z.enum([
  "navigate.open_patient",
  "navigate.focus_tooth",
  "cms.update_singleton",
  "cms.upsert_item",
  "cms.reorder",
  "cms.archive",
  "cms.set_media",
  "note.general",
  "note.clinical",
  "chart.set_surfaces",
  "chart.upsert_finding",
  "treatment.create",
  "treatment.update",
  "treatment.complete",
  "imaging.attach",
  "rx.create",
  "lab.create",
  "lab.update_status",
  "followup.book",
  "reservation.create",
  "reservation.reschedule",
  "reservation.cancel",
  "reservation.set_status",
  "whatsapp.send_text",
  "whatsapp.send_template",
  "whatsapp.set_status",
  "whatsapp.add_note",
]);

export type ActionKind = z.infer<typeof actionKindSchema>;

export const proposedActionSchema = z.object({
  id: z.string().min(1).max(80),
  kind: actionKindSchema,
  label: z.string().min(1).max(160),
  dependsOn: z.array(z.string().min(1)).max(20).optional().default([]),
  payload: z.record(z.string(), z.unknown()),
});

export type ProposedAction = z.infer<typeof proposedActionSchema>;

export const actionDiffSchema = z.object({
  actionId: z.string().min(1),
  kind: actionKindSchema,
  target: z.string().min(1),
  before: z.record(z.string(), z.unknown()),
  after: z.record(z.string(), z.unknown()),
  warnings: z.array(z.string()).default([]),
});

export type ActionDiff = z.infer<typeof actionDiffSchema>;

export const proposalStatusSchema = z.enum([
  "pending",
  "confirmed",
  "cancelled",
  "expired",
  "failed",
]);

export type ProposalStatus = z.infer<typeof proposalStatusSchema>;

export const createProposalInputSchema = z.object({
  source: z.enum(["clinic-chat", "treatment-chat"]).default("clinic-chat"),
  patientKey: z.string().min(1).max(120).nullable().optional(),
  summary: z.string().max(500).default(""),
  actions: z.array(proposedActionSchema).min(1).max(40),
});

export type CreateProposalInput = z.infer<typeof createProposalInputSchema>;

export const actionOutcomeSchema = z.object({
  actionId: z.string(),
  kind: actionKindSchema,
  ok: z.boolean(),
  message: z.string().optional(),
  result: z.record(z.string(), z.unknown()).optional(),
});

export type ActionOutcome = z.infer<typeof actionOutcomeSchema>;

export const executionResultSchema = z.object({
  proposalId: z.string(),
  ok: z.boolean(),
  outcomes: z.array(actionOutcomeSchema),
});

export type ExecutionResult = z.infer<typeof executionResultSchema>;
