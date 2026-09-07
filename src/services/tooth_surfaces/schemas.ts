import { z } from "zod";
import { FDI_PATTERN } from "../notation/types";

export const surfaceStatusSchema = z.enum(["unmarked", "decay", "filling"]);
export const wholeStatusSchema = z.enum(["none", "crown", "missing"]);
export const dentitionSchema = z.enum(["adult", "primary"]);
export const fdiNumberSchema = z.string().regex(FDI_PATTERN, "Invalid FDI");

export const toothSurfaceUpsertSchema = z.object({
  fdi_number: fdiNumberSchema,
  dentition: dentitionSchema,
  mesial: surfaceStatusSchema.default("unmarked"),
  distal: surfaceStatusSchema.default("unmarked"),
  occlusal: surfaceStatusSchema.default("unmarked"),
  facial: surfaceStatusSchema.default("unmarked"),
  lingual: surfaceStatusSchema.default("unmarked"),
  whole: wholeStatusSchema.default("none"),
});

export type ToothSurfaceUpsert = z.infer<typeof toothSurfaceUpsertSchema>;
