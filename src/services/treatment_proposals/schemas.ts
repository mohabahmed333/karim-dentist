import { z } from "zod";

export const proposalItemSchema = z.object({
  serviceId: z.string().uuid(),
  description: z.string().trim().min(1).max(200),
  amountEgp: z.number().positive(),
});

export const createProposalSchema = z.object({
  doctorId: z.string().uuid(),
  items: z.array(proposalItemSchema).min(1, "Add at least one service"),
});

export type CreateProposalValues = z.infer<typeof createProposalSchema>;
