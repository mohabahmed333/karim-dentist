"use client";

import { FeaturedEditor } from "./FeaturedEditor";
import type { FeaturedProject } from "@/services/featured_projects";

type Props = { items: FeaturedProject[] };

/** Slider images reuse the featured_projects table. */
export function SliderEditor({ items }: Props) {
  return (
    <FeaturedEditor
      items={items}
      titleKey="admin.pages.slider.title"
      addLabelKey="admin.pages.slider.add"
      emptyKey="admin.pages.slider.empty"
    />
  );
}
