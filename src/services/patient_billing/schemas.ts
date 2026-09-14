import { z } from "zod";

export const billingEntryUpsertSchema = z
  .object({
    kind: z.enum(["charge", "payment"]),
    amount_egp: z.number().positive(),
    description: z.string().trim().min(1).max(200),
    method: z.enum(["cash", "card", "instapay", "other"]).nullable().default(null),
    /** Which visit this entry is for, when staff picked one. */
    reservation_id: z.string().uuid().nullish(),
  })
  .superRefine((data, ctx) => {
    if (data.kind === "payment" && !data.method) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pick a payment method",
        path: ["method"],
      });
    }
  });

export type BillingEntryUpsertValues = z.infer<typeof billingEntryUpsertSchema>;
