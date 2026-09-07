import { z } from "zod";
import {
  APPLIANCE_TYPES,
  CONDITION_STATUSES,
  CONDITION_TYPES,
  ENCOUNTER_TYPES,
  LAB_STATUSES,
  MEDIA_TYPES,
  RX_FREQUENCIES,
  SEVERITIES,
} from "./enums";

export const universalToothSchema = z.number().int().min(1).max(32);

export const conditionNodeSchema = z.object({
  id: z.string().min(1),
  toothNumber: universalToothSchema,
  type: z.enum(CONDITION_TYPES),
  severity: z.enum(SEVERITIES),
  status: z.enum(CONDITION_STATUSES),
  vitalityIndex: z.number().min(0).max(180).nullable(),
  streamVisible: z.boolean(),
}).superRefine((node, ctx) => {
  if (node.type === "ENDODONTIC_INFECTION" && node.status === "ACTIVE" && node.vitalityIndex == null) {
    ctx.addIssue({
      code: "custom",
      message: "Active endodontic infection requires a vitality index",
      path: ["vitalityIndex"],
    });
  }
});

export const encounterCreateSchema = z.object({
  timestamp: z.string().min(1),
  type: z.enum(ENCOUNTER_TYPES),
  toothNumbers: z.array(universalToothSchema).min(1),
  providerId: z.string().min(1),
  notes: z.string().max(4000).optional().default(""),
  conditionId: z.string().min(1).optional(),
});

export const timelineQuerySchema = z.object({
  start: z.coerce.number().int().min(2014).max(2026),
  end: z.coerce.number().int().min(2014).max(2026),
});

export const labWebhookSchema = z.object({
  labOrderId: z.string().min(1),
  status: z.enum(LAB_STATUSES),
});

export const mediaTypeSchema = z.enum(MEDIA_TYPES);
export const applianceTypeSchema = z.enum(APPLIANCE_TYPES);
export const rxFrequencySchema = z.enum(RX_FREQUENCIES);

export type EncounterCreateInput = z.infer<typeof encounterCreateSchema>;
export type TimelineQuery = z.infer<typeof timelineQuerySchema>;
export type LabWebhookInput = z.infer<typeof labWebhookSchema>;
