import { z } from "zod";
import { WASTAGE_REASON_CODES } from "./types";

export const itemFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  name_ar: z.string().trim().optional().default(""),
  sku: z.string().trim().optional().nullable(),
  category: z.enum([
    "implant",
    "anesthesia",
    "injectable",
    "suture",
    "bone_graft",
    "disposable",
    "ppe",
    "instrument",
    "general",
  ]),
  unit: z.enum(["unit", "vial", "ampoule", "box", "ml", "mg", "syringe"]),
  tracks_batches: z.boolean().default(true),
  min_stock_level: z.number().min(0).default(0),
  reorder_qty: z.number().min(0).default(0),
  default_supplier_id: z.string().uuid().nullable().optional(),
  last_unit_cost_egp: z.number().min(0).nullable().optional(),
  wastage_approval_threshold_egp: z.number().min(0).nullable().optional(),
});
export type ItemFormValues = z.infer<typeof itemFormSchema>;

export const supplierFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  contact_name: z.string().trim().optional().default(""),
  phone: z.string().trim().optional().default(""),
  whatsapp_phone: z.string().trim().optional().nullable(),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")).nullable(),
  notes: z.string().trim().optional().default(""),
});
export type SupplierFormValues = z.infer<typeof supplierFormSchema>;

export const recipeFormSchema = z.object({
  service_id: z.string().uuid(),
  item_id: z.string().uuid(),
  kind: z.enum(["fixed", "variable"]).default("fixed"),
  default_qty: z.number().positive("Quantity must be greater than zero"),
  is_required: z.boolean().default(true),
  notes: z.string().trim().optional().default(""),
});
export type RecipeFormValues = z.infer<typeof recipeFormSchema>;

export const restockFormSchema = z.object({
  item_id: z.string().uuid(),
  supplier_id: z.string().uuid().nullable().optional(),
  lot_number: z.string().trim().optional().nullable(),
  expires_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  qty_received: z.number().positive("Quantity must be greater than zero"),
  unit_cost_egp: z.number().min(0).default(0),
});
export type RestockFormValues = z.infer<typeof restockFormSchema>;

export const adjustmentFormSchema = z.object({
  item_id: z.string().uuid(),
  qty_delta: z.number().refine((v) => v !== 0, "Enter a non-zero adjustment"),
  reason_note: z.string().trim().min(1, "A note is required for a manual adjustment"),
});
export type AdjustmentFormValues = z.infer<typeof adjustmentFormSchema>;

/** Requires reason_note whenever reason_code is 'other', mirroring the
 * char_length(trim(...)) > 0 CHECK idiom used elsewhere in this schema
 * (e.g. patient_billing_entries.description). */
export const wastageFormSchema = z
  .object({
    item_id: z.string().uuid(),
    qty: z.number().positive("Quantity must be greater than zero"),
    reason_code: z.enum(WASTAGE_REASON_CODES as [string, ...string[]]),
    reason_note: z.string().trim().optional().default(""),
    photo_url: z.string().trim().nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.reason_code === "other" && value.reason_note.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["reason_note"],
        message: "Describe the reason when 'Other' is selected",
      });
    }
  });
export type WastageFormValues = z.infer<typeof wastageFormSchema>;

export const approveWastageSchema = z.object({
  transaction_id: z.string().uuid(),
  decision: z.enum(["confirmed", "rejected"]),
  note: z.string().trim().optional().default(""),
});
export type ApproveWastageValues = z.infer<typeof approveWastageSchema>;

/** One decimal qty per variable service_recipes row — the mandatory
 * checkout step at appointment completion. Every entry must be > 0: this is
 * what makes the step unskippable, enforced here server-side and not only
 * by the completion dialog's own disabled-button state. */
export const consumablesCheckoutSchema = z.array(
  z.object({
    item_id: z.string().uuid(),
    qty_used: z.number().positive("Enter the quantity used"),
  }),
);
export type ConsumablesCheckoutValues = z.infer<typeof consumablesCheckoutSchema>;

export const inventorySettingsFormSchema = z.object({
  mode: z.enum(["off", "dry_run", "send"]),
  manager_whatsapp_phone: z.string().trim().nullable().optional(),
  wastage_approval_threshold_egp: z.number().min(0),
  wastage_photo_threshold_egp: z.number().min(0),
  realert_after_days: z.number().int().positive(),
});
export type InventorySettingsFormValues = z.infer<typeof inventorySettingsFormSchema>;
