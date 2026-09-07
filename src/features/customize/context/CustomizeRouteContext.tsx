"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CustomizeTarget } from "../components/PreviewClickLayer";
import { parseSectionBlockIdFromField } from "../lib/sectionField";
import { isCustomizeSection, type CustomizeSection } from "../types";

export type CustomizeRoute = {
  section: CustomizeSection;
  itemId: string | null;
  focusField: string | null;
  builderMode: boolean;
  sectionBlockId: string | null;
  indexPreview: boolean;
};

type RouteContextValue = {
  route: CustomizeRoute;
  navigate: (target: CustomizeTarget) => void;
  navigateSection: (section: CustomizeSection) => void;
  openCaseStudyBuilder: (caseStudyId: string) => void;
  openCaseStudyCard: (caseStudyId: string) => void;
  openFeaturedBuilder: (featuredProjectId: string) => void;
  openFeaturedCard: (featuredProjectId: string) => void;
  setIndexPreview: (enabled: boolean) => void;
};

const CustomizeRouteContext = createContext<RouteContextValue | null>(null);

function parseRoute(pathname: string, field: string | null, view: string | null): CustomizeRoute {
  const parts = pathname
    .replace(/^\/admin\/customize\/?/, "")
    .split("/")
    .filter(Boolean);
  const raw = parts[0] ?? "hero";
  const section = isCustomizeSection(raw) ? raw : "hero";
  const builderMode = parts[2] === "builder";
  const itemId = parts[1] ?? null;
  return {
    section,
    itemId,
    focusField: field,
    builderMode,
    sectionBlockId:
      builderMode ? parseSectionBlockIdFromField(field) : null,
    indexPreview: view === "index" && !builderMode,
  };
}

function buildHref(route: CustomizeRoute): string {
  if (route.builderMode && route.section === "case-studies" && route.itemId) {
    const base = `/admin/customize/case-studies/${route.itemId}/builder`;
    if (route.focusField) {
      return `${base}?field=${encodeURIComponent(route.focusField)}`;
    }
    return base;
  }
  if (route.builderMode && route.section === "slider" && route.itemId) {
    const base = `/admin/customize/slider/${route.itemId}/builder`;
    if (route.focusField) {
      return `${base}?field=${encodeURIComponent(route.focusField)}`;
    }
    return base;
  }
  const base = route.itemId
    ? `/admin/customize/${route.section}/${route.itemId}`
    : `/admin/customize/${route.section}`;
  const params = new URLSearchParams();
  if (route.focusField) {
    params.set("field", route.focusField);
  }
  if (
    route.indexPreview &&
    !route.builderMode &&
    (route.section === "case-studies" || route.section === "slider")
  ) {
    params.set("view", "index");
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

function CustomizeRouteProviderInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const urlRoute = useMemo(
    () =>
      parseRoute(
        pathname,
        searchParams.get("field"),
        searchParams.get("view"),
      ),
    [pathname, searchParams],
  );
  const [pendingRoute, setPendingRoute] = useState<CustomizeRoute | null>(null);
  const route = pendingRoute ?? urlRoute;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync optimistic route with URL/history
    setPendingRoute(null);
  }, [pathname, searchParams]);

  const navigate = useCallback(
    (target: CustomizeTarget) => {
      const current = pendingRoute ?? urlRoute;
      const builderMode =
        target.builderMode ??
        ((target.section === "case-studies" || target.section === "slider") &&
          Boolean(target.itemId) &&
          Boolean(target.field?.startsWith("section-")));
      const sectionChanged = target.section !== current.section;
      const next: CustomizeRoute = {
        section: target.section,
        itemId: target.itemId ?? null,
        focusField: target.field ?? null,
        builderMode,
        sectionBlockId: builderMode
          ? parseSectionBlockIdFromField(target.field)
          : null,
        indexPreview: builderMode
          ? false
          : sectionChanged
            ? false
            : current.indexPreview,
      };
      setPendingRoute(next);
      const href = buildHref(next);
      startTransition(() => {
        router.replace(href, { scroll: false });
      });
    },
    [router, startTransition, pendingRoute, urlRoute],
  );

  const navigateSection = useCallback(
    (section: CustomizeSection) => {
      navigate({ section });
    },
    [navigate],
  );

  const openCaseStudyBuilder = useCallback(
    (caseStudyId: string) => {
      navigate({
        section: "case-studies",
        itemId: caseStudyId,
        builderMode: true,
      });
    },
    [navigate],
  );

  const openCaseStudyCard = useCallback(
    (caseStudyId: string) => {
      navigate({ section: "case-studies", itemId: caseStudyId });
    },
    [navigate],
  );

  const openFeaturedBuilder = useCallback(
    (featuredProjectId: string) => {
      navigate({
        section: "slider",
        itemId: featuredProjectId,
        builderMode: true,
      });
    },
    [navigate],
  );

  const openFeaturedCard = useCallback(
    (featuredProjectId: string) => {
      navigate({ section: "slider", itemId: featuredProjectId });
    },
    [navigate],
  );

  const setIndexPreview = useCallback(
    (enabled: boolean) => {
      const current = pendingRoute ?? urlRoute;
      const next: CustomizeRoute = {
        ...current,
        indexPreview: enabled,
        itemId: null,
        builderMode: false,
        focusField: null,
        sectionBlockId: null,
      };
      setPendingRoute(next);
      startTransition(() => {
        router.replace(buildHref(next), { scroll: false });
      });
    },
    [pendingRoute, urlRoute, router, startTransition],
  );

  const value = useMemo(
    () => ({
      route,
      navigate,
      navigateSection,
      openCaseStudyBuilder,
      openCaseStudyCard,
      openFeaturedBuilder,
      openFeaturedCard,
      setIndexPreview,
    }),
    [
      route,
      navigate,
      navigateSection,
      openCaseStudyBuilder,
      openCaseStudyCard,
      openFeaturedBuilder,
      openFeaturedCard,
      setIndexPreview,
    ],
  );

  return (
    <CustomizeRouteContext.Provider value={value}>
      {children}
    </CustomizeRouteContext.Provider>
  );
}

export function CustomizeRouteProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CustomizeRouteProviderInner>{children}</CustomizeRouteProviderInner>
  );
}

export function useCustomizeRoute(): RouteContextValue {
  const ctx = useContext(CustomizeRouteContext);
  if (!ctx) {
    throw new Error("useCustomizeRoute must be used within CustomizeRouteProvider");
  }
  return ctx;
}

const noop = () => undefined;

/** Fixed route for embeds (showreel demo) without URL navigation. */
export function CustomizeRouteStaticProvider({
  route,
  children,
}: {
  route: CustomizeRoute;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({
      route,
      navigate: noop,
      navigateSection: noop,
      openCaseStudyBuilder: noop,
      openCaseStudyCard: noop,
      openFeaturedBuilder: noop,
      openFeaturedCard: noop,
      setIndexPreview: noop,
    }),
    [route],
  );

  return (
    <CustomizeRouteContext.Provider value={value}>
      {children}
    </CustomizeRouteContext.Provider>
  );
}
