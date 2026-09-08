"use client";

import { memo, useDeferredValue } from "react";
import { useCustomizeData } from "../context/CustomizeContext";
import { useCustomizeRoute } from "../context/CustomizeRouteContext";
import { previewDeviceFrameStyle } from "../lib/previewDeviceFrameStyle";
import { deviceSpec, type PreviewDeviceId } from "../lib/previewDevices";
import type { CustomizeSection } from "../types";
import { DeviceSwitcher } from "./DeviceSwitcher";
import { LivePreviewBody } from "./LivePreviewBody";
import { PreviewClickLayer } from "./PreviewClickLayer";
import { PreviewResponsiveIframe } from "./PreviewResponsiveIframe";
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
  const isSyncing = previewData !== data;
  const isDesktop = device === "desktop";
  const spec = deviceSpec(device);
  const frameStyle = isDesktop ? undefined : previewDeviceFrameStyle(device);

  const preview = (
    <PreviewClickLayer onSelect={navigate}>
      <div
        className={
          isSyncing
            ? "customize-preview-root min-h-full opacity-95 transition-opacity duration-150"
            : "customize-preview-root min-h-full"
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
  );

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
            : "relative flex min-h-0 flex-1 justify-center overflow-hidden px-5 pb-5"
        }
      >
        {isDesktop ? (
          <div className="flex h-full min-h-0 w-full max-w-[1600px] flex-col">
            <div
              className="customize-device-frame h-full min-h-0 w-full flex-1 overflow-auto"
              data-device={device}
              data-customize-preview-scroll
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
        ) : (
          <div
            className="customize-device-frame h-full overflow-hidden transition-[width,max-height] duration-200 ease-out"
            style={frameStyle}
            data-device={device}
          >
            <PreviewResponsiveIframe
              viewportWidth={spec.width}
              className="h-full w-full border-0 bg-white"
              title={`${spec.label} preview`}
            >
              {preview}
            </PreviewResponsiveIframe>
          </div>
        )}
      </div>
    </div>
  );
});
