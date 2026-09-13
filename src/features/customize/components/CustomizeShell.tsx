"use client";

import { Suspense, useState } from "react";
import { useLocale, useTranslations } from "@/lib/i18n";
import { useAdminDarkMode } from "@/features/admin/hooks/useAdminDarkMode";
import { cn } from "@/lib/utils";
import {
  CustomizeRouteProvider,
  useCustomizeRoute,
} from "../context/CustomizeRouteContext";
import type { PreviewDeviceId } from "../lib/previewDevices";
import { CustomizeEditor } from "./CustomizeEditor";
import { CustomizeHeader } from "./CustomizeHeader";
import { CustomizeSidebar } from "./CustomizeSidebar";
import { CustomizeTour } from "./CustomizeTour";
import { CustomizeTranslateOverlay } from "./CustomizeTranslateOverlay";
import { CmsTranslateProvider } from "./CmsTranslateProvider";
import { LivePreview } from "./LivePreview";
import { UnsavedChangesGuard } from "./UnsavedChangesGuard";
import { useCustomizeTour } from "./useCustomizeTour";
import { useTourRouteSync } from "./useTourRouteSync";

function CustomizeShellInner() {
  const { route, navigate } = useCustomizeRoute();
  const { locale } = useLocale();
  const { darkMode } = useAdminDarkMode();
  const [device, setDevice] = useState<PreviewDeviceId>("desktop");
  const tour = useCustomizeTour();
  useTourRouteSync(tour.open, tour.step, route, navigate);

  return (
    <CmsTranslateProvider>
      <UnsavedChangesGuard>
        <div
          className={cn(
            "customize-shell relative flex h-full min-h-0 flex-1 overflow-hidden bg-[var(--admin-canvas)] text-[var(--admin-text)]",
            locale === "ar" && "font-[family-name:var(--font-arabic)]",
            darkMode && "dark",
          )}
        >
          <CustomizeSidebar>
            <CustomizeEditor
              section={route.section}
              itemId={route.itemId ?? undefined}
              focusField={route.focusField}
              builderMode={route.builderMode}
            />
          </CustomizeSidebar>
          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-[var(--admin-panel)]">
            <CustomizeHeader
              active={route.section}
              itemId={route.itemId}
              onStartGuide={tour.startGuide}
            />
            <LivePreview
              section={route.section}
              itemId={route.itemId}
              device={device}
              onDeviceChange={setDevice}
              builderMode={route.builderMode}
            />
          </div>
          <CustomizeTranslateOverlay />
        </div>
        <CustomizeTour
          open={tour.open}
          step={tour.step}
          stepIndex={tour.stepIndex}
          stepCount={tour.stepCount}
          onBack={tour.back}
          onNext={tour.next}
          onSkip={tour.skip}
        />
      </UnsavedChangesGuard>
    </CmsTranslateProvider>
  );
}

export function CustomizeShell() {
  const t = useTranslations();
  return (
    <Suspense
      fallback={
        <div className="flex h-full min-h-0 flex-1 items-center justify-center bg-[var(--admin-canvas)] text-sm text-[var(--admin-muted)]">
          {t("admin.customize.loading")}
        </div>
      }
    >
      <CustomizeRouteProvider>
        <CustomizeShellInner />
      </CustomizeRouteProvider>
    </Suspense>
  );
}
