import type { ShowreelProductScene } from "./showreelSlideTypes";

const PRODUCT_SCENES: readonly ShowreelProductScene[] = [
  "ai-booking",
  "whatsapp",
  "clinical-ai",
  "smart-ux",
  "dashboard",
  "site-to-chat",
] as const;

export function isShowreelProductScene(
  value: string | null | undefined,
): value is ShowreelProductScene {
  return (
    typeof value === "string" &&
    (PRODUCT_SCENES as readonly string[]).includes(value)
  );
}

export function parseShowreelProductScene(
  value: string | null | undefined,
): ShowreelProductScene {
  return isShowreelProductScene(value) ? value : "ai-booking";
}

export type ShowreelDemoMode = "site" | "customize" | "product";

export function parseShowreelDemoMode(
  value: string | null | undefined,
): ShowreelDemoMode {
  if (value === "customize") return "customize";
  if (value === "product") return "product";
  return "site";
}
