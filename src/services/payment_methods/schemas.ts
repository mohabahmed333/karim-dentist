import { z } from "zod";

export const paymentMethodSchema = z.object({
  kind: z.enum(["instapay", "wallet"]),
  label: z.string().trim().max(80).default(""),
  value: z.string().trim().min(1, "A number or handle is required").max(120),
  is_primary: z.boolean().default(false),
});

export type PaymentMethodValues = z.infer<typeof paymentMethodSchema>;
