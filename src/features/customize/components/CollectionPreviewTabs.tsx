"use client";

import { EditorOpenPageLink } from "./EditorOpenPageLink";
import { EditorSegmentTabs } from "./EditorSegmentTabs";

type Props = {
  indexPreview: boolean;
  onChange: (indexPreview: boolean) => void;
  viewHref: string;
};

export function CollectionPreviewTabs({
  indexPreview,
  onChange,
  viewHref,
}: Props) {
  return (
    <div className="space-y-1.5">
      <EditorSegmentTabs
        ariaLabel="Preview page"
        value={indexPreview ? "index" : "home"}
        options={[
          { id: "home", label: "Homepage" },
          { id: "index", label: "Index page" },
        ]}
        onChange={(next) => onChange(next === "index")}
      />
      <div className="flex items-center justify-between gap-2 px-0.5">
        <p className="text-[10px] leading-snug text-[#8a8a8a]">
          Fields apply to the selected preview.
        </p>
        <EditorOpenPageLink href={viewHref} />
      </div>
    </div>
  );
}
