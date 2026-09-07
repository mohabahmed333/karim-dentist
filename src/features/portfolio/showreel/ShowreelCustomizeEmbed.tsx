"use client";

import { useEffect } from "react";
import type { CustomizeRoute } from "@/features/customize/context/CustomizeRouteContext";
import { CustomizeRouteStaticProvider } from "@/features/customize";
import { CustomizeEditor } from "@/features/customize/components/CustomizeEditor";
import { CustomizeHeader } from "@/features/customize/components/CustomizeHeader";
import { CustomizeSidebar } from "@/features/customize/components/CustomizeSidebar";
import { LivePreview } from "@/features/customize/components/LivePreview";
import { UnsavedChangesGuard } from "@/features/customize/components/UnsavedChangesGuard";
import { postShowreelEmbedReady } from "@/features/portfolio/showreel/showreelEmbedMessage";

type Props = {
  route: CustomizeRoute;
};

function resetSidebarScroll(root: ParentNode) {
  root.querySelectorAll<HTMLElement>("aside").forEach((el) => {
    el.scrollTop = 0;
    el.scrollLeft = 0;
  });
}

/** Read-only customize shell for showreel — always desktop preview. */
export function ShowreelCustomizeEmbed({ route }: Props) {
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

  return (
    <CustomizeRouteStaticProvider route={route}>
      <UnsavedChangesGuard>
        <div className="showreel-demo-customize customize-shell flex h-screen flex-col bg-[#f2f2f2] text-[#1a1a1a]">
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
                device="desktop"
                onDeviceChange={() => undefined}
                builderMode={route.builderMode}
                sectionScrollOnly
              />
            </div>
          </div>
        </div>
      </UnsavedChangesGuard>
    </CustomizeRouteStaticProvider>
  );
}
