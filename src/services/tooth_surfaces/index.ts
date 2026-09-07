export type {
  PaintTool,
  SurfaceId,
  SurfaceMap,
  SurfaceStatus,
  WholeStatus,
} from "./paint";
export { applyPaint, emptySurfaces } from "./paint";
export {
  dentitionSchema,
  fdiNumberSchema,
  surfaceStatusSchema,
  toothSurfaceUpsertSchema,
  wholeStatusSchema,
} from "./schemas";
export type { ToothSurfaceUpsert } from "./schemas";
export type { PatientToothSurface } from "./types";
export { listToothSurfaces } from "./queries";
export { upsertToothSurfaces } from "./mutations";
