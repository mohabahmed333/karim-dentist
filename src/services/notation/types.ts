export type Dentition = "adult" | "primary";
export type NotationSystem = "fdi" | "universal" | "palmer";

export const FDI_PATTERN = /^([1-4][1-8]|[5-8][1-5])$/;

export function isChartFdi(value: string): boolean {
  return FDI_PATTERN.test(value);
}
