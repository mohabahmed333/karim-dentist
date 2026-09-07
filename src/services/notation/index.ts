export type { Dentition, NotationSystem } from "./types";
export { FDI_PATTERN, isChartFdi } from "./types";
export { fdiSet, adjacentChartFdi } from "./sets";
export {
  ADULT_UPPER_RIGHT,
  ADULT_UPPER_LEFT,
  ADULT_LOWER_LEFT,
  ADULT_LOWER_RIGHT,
  PRIMARY_UPPER_RIGHT,
  PRIMARY_UPPER_LEFT,
  PRIMARY_LOWER_LEFT,
  PRIMARY_LOWER_RIGHT,
} from "./sets";
export { chartToothName, mesialOnRight } from "./names";
export { chartToothKind, type ChartToothKind } from "./chartToothKind";
export {
  probeToothGltfKinds,
  toothGltfKind,
  toothGltfUrl,
  TOOTH_GLTF_KINDS,
  type ToothGltfKind,
} from "./toothGltf";
export { fdiFromArchPoint, universalFromArchPoint } from "./archPoint";
export { CHART_CROWN_PATHS, CHART_CROWN_WIDTH } from "./chartCrownPaths";
export { displayTooth } from "./display";
export { chartInspectorTitle } from "./inspectorTitle";
export { fdiForUniversalAdult, universalForFdi } from "./convert";
