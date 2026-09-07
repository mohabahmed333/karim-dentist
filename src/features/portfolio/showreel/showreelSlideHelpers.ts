import type { ShowreelSlide } from "./showreelSlideTypes";

export function getShowreelDeviceIds(slides: ShowreelSlide[]) {
  return slides.flatMap((slide) => {
    if (slide.kind !== "feature") return [];
    const ids = [`${slide.id}:desktop`];
    return slide.desktopOnly ? ids : [...ids, `${slide.id}:mobile`];
  });
}

export function areShowreelDevicesReady(
  deviceIds: string[],
  readyIds: ReadonlySet<string>,
) {
  return deviceIds.every((id) => readyIds.has(id));
}
