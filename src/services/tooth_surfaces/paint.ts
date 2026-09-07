export type SurfaceId =
  | "mesial"
  | "distal"
  | "occlusal"
  | "facial"
  | "lingual";

export type SurfaceStatus = "unmarked" | "decay" | "filling";
export type WholeStatus = "none" | "crown" | "missing";
export type PaintTool =
  | "select"
  | "decay"
  | "filling"
  | "crown"
  | "missing"
  | "clear";

export type SurfaceMap = {
  mesial: SurfaceStatus;
  distal: SurfaceStatus;
  occlusal: SurfaceStatus;
  facial: SurfaceStatus;
  lingual: SurfaceStatus;
  whole: WholeStatus;
};

export function emptySurfaces(): SurfaceMap {
  return {
    mesial: "unmarked",
    distal: "unmarked",
    occlusal: "unmarked",
    facial: "unmarked",
    lingual: "unmarked",
    whole: "none",
  };
}

export function applyPaint(
  current: SurfaceMap,
  tool: PaintTool,
  surface: SurfaceId,
): SurfaceMap {
  if (tool === "select") return current;
  if (tool === "missing") return { ...emptySurfaces(), whole: "missing" };
  if (tool === "crown") return { ...current, whole: "crown" };
  if (tool === "clear") {
    if (current.whole !== "none") return emptySurfaces();
    return { ...current, [surface]: "unmarked" };
  }
  if (current.whole !== "none") return current;
  if (tool === "decay" || tool === "filling") {
    return { ...current, [surface]: tool };
  }
  return current;
}
