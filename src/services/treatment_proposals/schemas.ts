import { z } from "zod";

export const proposalItemSchema = z.object({
  serviceId: z.string().uuid(),
  description: z.string().trim().min(1).max(200),
  amountEgp: z.number().positive(),
});

export const createProposalSchema = z.object({
  doctorId: z.string().uuid(),
  items: z.array(proposalItemSchema).min(1, "Add at least one service"),
  /** Which visit this proposal is for, when staff picked one — optional, matches today's behavior when omitted. */
  reservationId: z.string().uuid().nullish(),
  /** What the doctor wants the front desk to know before they take the money. */
  note: z.string().trim().max(500).optional(),
});

export type CreateProposalValues = z.infer<typeof createProposalSchema>;
