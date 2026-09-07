"use client";

import {
  PreviewCard,
  PreviewCardContent,
  PreviewCardTrigger,
} from "@/components/ui/preview-card";
import type { LayoutCatalogItem } from "../lib/layoutCatalog";
import { LAYOUT_CATALOG } from "../lib/layoutCatalog";
import { LayoutPreviewThumb } from "./LayoutPreviewThumb";

type Props = {
  onAdd: (item: LayoutCatalogItem) => void;
  busy?: boolean;
};

export function CaseStudyLayoutLibrary({ onAdd, busy }: Props) {
  return (
    <div className="layout-library">
      <p className="layout-library-hint">
        {LAYOUT_CATALOG.length} layouts · hover for example · click to add
      </p>
      <div className="layout-library-scroll">
        <div className="layout-library-grid">
          {LAYOUT_CATALOG.map((item) => (
            <PreviewCard key={item.id}>
              <PreviewCardTrigger
                delay={120}
                closeDelay={80}
                render={
                  <button
                    type="button"
                    className="layout-library-card"
                    disabled={busy}
                    onClick={() => onAdd(item)}
                  />
                }
              >
                <LayoutPreviewThumb preview={item.preview} />
                <span className="layout-library-label">{item.label}</span>
              </PreviewCardTrigger>
              <PreviewCardContent side="right" align="start" sideOffset={12}>
                <div className="layout-library-popover">
                  <LayoutPreviewThumb preview={item.preview} large />
                  <div>
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="mt-1 text-[12px] leading-snug text-[#6b6b6b]">
                      {item.description}
                    </p>
                    <p className="mt-2 text-[10px] uppercase tracking-wide text-[#9a9a9a]">
                      Click card to add
                    </p>
                  </div>
                </div>
              </PreviewCardContent>
            </PreviewCard>
          ))}
        </div>
      </div>
    </div>
  );
}
