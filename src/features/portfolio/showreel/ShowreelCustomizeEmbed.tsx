"use client";

import { useEffect, useState } from "react";
import type { CustomizeRoute } from "@/features/customize/context/CustomizeRouteContext";
import { CustomizeRouteStaticProvider } from "@/features/customize";
import { CmsTranslateProvider } from "@/features/customize/components/CmsTranslateProvider";
import { CustomizeEditor } from "@/features/customize/components/CustomizeEditor";
import { CustomizeHeader } from "@/features/customize/components/CustomizeHeader";
import { CustomizeSidebar } from "@/features/customize/components/CustomizeSidebar";
import { CustomizeTranslateOverlay } from "@/features/customize/components/CustomizeTranslateOverlay";
import { LivePreview } from "@/features/customize/components/LivePreview";
import { UnsavedChangesGuard } from "@/features/customize/components/UnsavedChangesGuard";
import type { PreviewDeviceId } from "@/features/customize/lib/previewDevices";
import { useLocale } from "@/lib/i18n";
import { ShowreelCursorOverlay } from "@/features/portfolio/showreel/product-scenes/ShowreelCursorOverlay";
import { useShowreelCursorScript } from "@/features/portfolio/showreel/product-scenes/useShowreelCursorScript";
import { SHOWREEL_CUSTOMIZE_CURSOR_STEPS } from "@/features/portfolio/showreel/showreelCustomizeCursorTimeline";
import {
  SHOWREEL_CUSTOMIZE_UI_EVENT,
  type ShowreelCustomizeUiDetail,
} from "@/features/portfolio/showreel/showreelCustomizeUi";
import { postShowreelEmbedReady } from "@/features/portfolio/showreel/showreelEmbedMessage";
import { isShowreelProductActivateMessage } from "@/features/portfolio/showreel/showreelProductActivate";

type Props = {
  route: CustomizeRoute;
};

const CUSTOMIZE_CURSOR_ROOT = ".showreel-demo-customize";

function resetSidebarScroll(root: ParentNode) {
  root.querySelectorAll<HTMLElement>("aside").forEach((el) => {
    el.scrollTop = 0;
    el.scrollLeft = 0;
  });
}

/** Customize shell for showreel — scripted device + locale + live content patches. */
export function ShowreelCustomizeEmbed({ route }: Props) {
  const { setLocale } = useLocale();
  const [device, setDevice] = useState<PreviewDeviceId>("desktop");
  const [active, setActive] = useState(false);
  const cursor = useShowreelCursorScript(
    active,
    active ? 1 : 0,
    SHOWREEL_CUSTOMIZE_CURSOR_STEPS,
    CUSTOMIZE_CURSOR_ROOT,
  );

  useEffect(() => {
    // Same activate signal every product scene uses (see
    // ShowreelSlideFeature's activate effect), just keyed by the fixed
    // "customize" scene id since this isn't a real productScene.
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (!isShowreelProductActivateMessage(event.data)) return;
      if (event.data.scene !== "customize") return;
      setActive(event.data.active);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    const root = document.querySelector(".showreel-demo-customize");
    if (!root) return;
    resetSidebarScroll(root);

    let raf = 0;
    raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => postShowreelEmbedReady("customize"));
    });

    return () => cancelAnimationFrame(raf);
  }, [route.section, route.itemId, route.builderMode, route.indexPreview]);

  useEffect(() => {
    function onUi(event: Event) {
      const detail = (event as CustomEvent<ShowreelCustomizeUiDetail>).detail;
      if (!detail) return;
      if (detail.type === "device") setDevice(detail.device);
      if (detail.type === "locale") setLocale(detail.locale);
    }
    window.addEventListener(SHOWREEL_CUSTOMIZE_UI_EVENT, onUi);
    return () => window.removeEventListener(SHOWREEL_CUSTOMIZE_UI_EVENT, onUi);
  }, [setLocale]);

  return (
    <CustomizeRouteStaticProvider route={route}>
      <CmsTranslateProvider>
        <UnsavedChangesGuard>
          <div
            className="showreel-demo-customize customize-shell relative flex h-screen flex-col bg-[#f2f2f2] text-[#1a1a1a]"
            data-showreel-action="customize-shell"
          >
            <CustomizeHeader
              active={route.section}
              itemId={route.itemId}
              onStartGuide={() => undefined}
            />
            <div className="flex min-h-0 flex-1">
              <CustomizeSidebar>
                <CustomizeEditor
                  section={route.section}
                  itemId={route.itemId ?? undefined}
                  focusField={route.focusField}
                  builderMode={route.builderMode}
                />
              </CustomizeSidebar>
              <div className="relative flex min-w-0 flex-1 flex-col bg-white">
                <LivePreview
                  section={route.section}
                  itemId={route.itemId}
                  device={device}
                  onDeviceChange={setDevice}
                  builderMode={route.builderMode}
                  sectionScrollOnly
                />
              </div>
            </div>
            <CustomizeTranslateOverlay />
            <ShowreelCursorOverlay {...cursor} />
          </div>
        </UnsavedChangesGuard>
      </CmsTranslateProvider>
    </CustomizeRouteStaticProvider>
  );
}
