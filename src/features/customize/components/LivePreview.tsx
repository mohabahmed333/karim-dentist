"use client";

import { memo, useDeferredValue } from "react";
import { useCustomizeData } from "../context/CustomizeContext";
import { useCustomizeRoute } from "../context/CustomizeRouteContext";
import { deviceSpec, type PreviewDeviceId } from "../lib/previewDevices";
import type { CustomizeSection } from "../types";
import { DeviceSwitcher } from "./DeviceSwitcher";
import { LivePreviewBody } from "./LivePreviewBody";
import { PreviewClickLayer } from "./PreviewClickLayer";
import { usePreviewScroll } from "./usePreviewScroll";

type Props = {
  section: CustomizeSection;
  itemId: string | null;
  device: PreviewDeviceId;
  onDeviceChange: (id: PreviewDeviceId) => void;
  builderMode?: boolean;
  freezePreviewScroll?: boolean;
  sectionScrollOnly?: boolean;
};

export const LivePreview = memo(function LivePreview({
  section,
  itemId,
  device,
  onDeviceChange,
  builderMode,
  freezePreviewScroll,
  sectionScrollOnly,
}: Props) {
  const data = useCustomizeData();
  const previewData = useDeferredValue(data);
  const { navigate, route } = useCustomizeRoute();
  const rootRef = usePreviewScroll(
    section,
    itemId,
    builderMode,
    route.focusField,
    route.indexPreview,
    freezePreviewScroll,
    sectionScrollOnly,
  );
  const spec = deviceSpec(device);
  const isSyncing = previewData !== data;
  const isDesktop = device === "desktop";

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col bg-[#f0f0f0]"
      data-tour="preview"
    >
      <div className="flex shrink-0 justify-center px-5 pt-4 pb-2">
        <DeviceSwitcher value={device} onChange={onDeviceChange} />
      </div>

      <div
        className={
          isDesktop
            ? "flex min-h-0 flex-1 justify-center px-4 pb-4 sm:px-5"
            : "relative min-h-0 flex-1 overflow-auto px-5 pb-5"
        }
        {...(!isDesktop
          ? { "data-customize-preview-scroll": true }
          : {})}
      >
        <div
          className={
            isDesktop
              ? "flex h-full min-h-0 w-full max-w-[1600px] flex-col"
              : "mx-auto flex w-full max-w-full flex-col items-center"
          }
          style={
            isDesktop
              ? undefined
              : { width: `min(100%, ${spec.width}px)` }
          }
        >
          <div
            className={
              isDesktop
                ? "customize-device-frame h-full min-h-0 w-full flex-1 overflow-auto"
                : "customize-device-frame w-full overflow-auto transition-[height] duration-200 ease-out"
            }
            style={
              isDesktop
                ? undefined
                : {
                    height: `min(${spec.height ?? 900}px, calc(100% - 0.5rem))`,
                  }
            }
            data-device={device}
            {...(isDesktop
              ? { "data-customize-preview-scroll": true }
              : {})}
          >
            <PreviewClickLayer onSelect={navigate}>
              <div
                className={
                  isSyncing
                    ? "customize-preview-root h-full opacity-95 transition-opacity duration-150"
                    : "customize-preview-root h-full"
                }
              >
                <LivePreviewBody
                  section={section}
                  itemId={itemId}
                  device={device}
                  builderMode={builderMode}
                  indexPreview={route.indexPreview}
                  data={previewData}
                  rootRef={rootRef}
                />
              </div>
            </PreviewClickLayer>
          </div>
        </div>
      </div>
    </div>
  );
});
