import { deviceSpec, type PreviewDeviceId } from "./previewDevices";

/** Styles for the non-desktop device chrome in LivePreview. */
export function previewDeviceFrameStyle(device: PreviewDeviceId): {
  width: string;
  maxHeight: string;
} {
  const spec = deviceSpec(device);
  const h = spec.height ?? 900;
  return {
    width: `min(100%, ${spec.width}px)`,
    // Parent is the flex-1 scrollport (definite height). Fill it, cap at device.
    maxHeight: `min(${h}px, 100%)`,
  };
}
