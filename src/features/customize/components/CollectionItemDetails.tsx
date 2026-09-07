"use client";

import type { CollectionSection } from "../types";
import { CaseStudyItemFields } from "./CaseStudyItemFields";
import { FeaturedItemFields } from "./FeaturedItemFields";
import { FooterItemFields } from "./FooterItemFields";
import { FooterKeywordField } from "./FooterKeywordField";
import { ServiceItemFields } from "./ServiceItemFields";

type Props = {
  section: CollectionSection;
  item: Record<string, unknown> & { id: string };
  focusField?: string | null;
  onPatch: (partial: Record<string, unknown>) => void;
};

export function CollectionItemDetails({
  section,
  item,
  focusField,
  onPatch,
}: Props) {
  if (section === "case-studies") {
    return (
      <CaseStudyItemFields
        item={item}
        onPatch={onPatch}
        focusField={focusField}
      />
    );
  }
  if (section === "slider") {
    return (
      <FeaturedItemFields
        item={item}
        onPatch={onPatch}
        focusField={focusField}
      />
    );
  }
  if (section === "services") {
    return (
      <ServiceItemFields
        item={item}
        onPatch={onPatch}
        focusField={focusField}
      />
    );
  }
  if (section === "footer") {
    return (
      <>
        <FooterKeywordField focusField={focusField} />
        <FooterItemFields item={item} onPatch={onPatch} />
      </>
    );
  }
  return null;
}
