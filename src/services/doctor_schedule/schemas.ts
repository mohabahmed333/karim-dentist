import { z } from "zod";
import { timeWindowsIssue } from "@/services/clinic_schedule";

const WINDOW_RE = /^\d{2}:\d{2}-\d{2}:\d{2}$/;

/** Same shape as clinic_hours' upsert schema — horizon/timezone stay clinic-wide. */
export const doctorHoursUpsertSchema = z
  .object({
    open_weekdays: z
      .array(z.number().int().min(0).max(6))
      .min(1, "Pick at least one open day"),
    time_windows: z
      .array(z.string().regex(WINDOW_RE))
      .min(1, "Add at least one time window"),
    slot_minutes: z.union([
      z.literal(15),
      z.literal(30),
      z.literal(45),
      z.literal(60),
      z.literal(90),
      z.literal(120),
    ]),
    is_bookable: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    const issue = timeWindowsIssue(data.time_windows);
    if (issue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: issue,
        path: ["time_windows"],
      });
    }
  });

export type DoctorHoursUpsertValues = z.infer<typeof doctorHoursUpsertSchema>;
