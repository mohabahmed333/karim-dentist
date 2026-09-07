export const PREVIEW_DEVICES = [
  { id: "desktop", label: "Desktop", width: 1600, height: null },
  { id: "tablet", label: "Tablet", width: 834, height: 1112 },
  { id: "mobile", label: "Mobile", width: 430, height: 932 },
] as const;

export type PreviewDeviceId = (typeof PREVIEW_DEVICES)[number]["id"];

export function deviceSpec(id: PreviewDeviceId) {
  return (
    PREVIEW_DEVICES.find((d) => d.id === id) ?? PREVIEW_DEVICES[0]
  );
}

export function deviceWidth(id: PreviewDeviceId): number {
  return deviceSpec(id).width;
}
