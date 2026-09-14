import { z } from "zod";
import { DOCTOR_COLOR_PALETTE } from "./colorPalette";

const PALETTE: readonly string[] = DOCTOR_COLOR_PALETTE;

export const doctorIdentityUpsertSchema = z.object({
  specialty: z.string().trim().max(120).nullable(),
  bio: z.string().trim().max(500).nullable(),
  calendar_color: z
    .string()
    .nullable()
    .refine((value) => value === null || PALETTE.includes(value), {
      message: "Not a valid calendar color",
    }),
});

export type DoctorIdentityUpsertValues = z.infer<
  typeof doctorIdentityUpsertSchema
>;
