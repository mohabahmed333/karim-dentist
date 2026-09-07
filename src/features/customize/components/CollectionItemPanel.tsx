"use client";

import { Button } from "@/components/ui/button";
import { useCustomize } from "../context/CustomizeContext";
import { useCustomizeRoute } from "../context/CustomizeRouteContext";
import type { CollectionSection } from "../types";
import type { Tables } from "@/lib/supabase/database.types";
import { isReservedFooterLink } from "@/features/portfolio/lib/footerLinkHref";
import { featuredProjectPath } from "@/features/portfolio/lib/featuredProjectPath";
import { collectionItems } from "../lib/collectionMeta";
import { CollectionItemDetails } from "./CollectionItemDetails";
import { CollectionItemPageTabs } from "./CollectionItemPageTabs";
import { EditorFieldCard, EditorSectionHeader } from "./EditorSectionChrome";
import { EditorOpenPageLink } from "./EditorOpenPageLink";
import { EditorPanelShell } from "./EditorPanelShell";
import { useFocusEditorField } from "./useFocusEditorField";

type Props = {
  section: CollectionSection;
  id: string;
  focusField?: string | null;
};

function publicItemHref(
  section: CollectionSection,
  item: Record<string, unknown> & { id: string },
): string | null {
  if (section === "case-studies") {
    const slug = String(item.slug ?? "").trim();
    return slug ? `/case-studies/${slug}` : "/case-studies";
  }
  if (section === "slider") {
    return "/#more-images";
  }
  if (section === "services") return "/#services";
  return null;
}

export function CollectionItemPanel({ section, id, focusField }: Props) {
  const { data, patchCollectionItem, removeCollectionItem } = useCustomize();
  const { navigate, openCaseStudyBuilder, openFeaturedBuilder } =
    useCustomizeRoute();
  const item = collectionItems(data, section).find((i) => i.id === id);
  const rootRef = useFocusEditorField(
    section === "footer" ? focusField : null,
    id,
  );

  if (!item) {
    return <p className="text-sm text-[#8a8a8a]">Item not found.</p>;
  }

  const viewHref = publicItemHref(section, item);

  if (
    section === "footer" &&
    isReservedFooterLink(item as Tables<"footer_links">)
  ) {
    return (
      <EditorPanelShell>
        <div ref={rootRef} className="space-y-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 rounded-[6px] px-2 text-xs"
            onClick={() => navigate({ section: "footer" })}
          >
            ← List
          </Button>
          <EditorFieldCard>
            <p className="text-[12px] font-medium">Contact</p>
            <p className="text-[11px] leading-relaxed text-[#8a8a8a]">
              This footer link always opens the contact form. Edit contact
              details in Settings → Contact.
            </p>
          </EditorFieldCard>
        </div>
      </EditorPanelShell>
    );
  }

  return (
    <EditorPanelShell>
      <div ref={rootRef} className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 rounded-[6px] px-2 text-xs"
            onClick={() => navigate({ section })}
          >
            ← List
          </Button>
          <div className="flex items-center gap-2">
            {viewHref ? <EditorOpenPageLink href={viewHref} /> : null}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-7 rounded-[6px] px-2 text-xs"
              onClick={() => {
                void removeCollectionItem(section, id).then(() =>
                  navigate({ section }),
                );
              }}
            >
              Delete
            </Button>
          </div>
        </div>
        <CollectionItemPageTabs
          section={section}
          id={id}
          openCaseStudyBuilder={openCaseStudyBuilder}
          openFeaturedBuilder={openFeaturedBuilder}
        />
        <EditorSectionHeader title="Details" />
        <EditorFieldCard>
          <CollectionItemDetails
            section={section}
            item={item}
            focusField={focusField}
            onPatch={(partial) => patchCollectionItem(section, id, partial)}
          />
        </EditorFieldCard>
      </div>
    </EditorPanelShell>
  );
}
