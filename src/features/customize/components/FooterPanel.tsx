"use client";

import { useEffect, useState } from "react";
import { useCustomize } from "../context/CustomizeContext";
import { FOOTER_COLUMNS, footerLinksForColumn } from "../lib/footerColumns";
import { EditorSectionHeader } from "./EditorSectionChrome";
import { EditorOpenPageLink } from "./EditorOpenPageLink";
import { EditorPanelShell } from "./EditorPanelShell";
import { EditorSegmentTabs } from "./EditorSegmentTabs";
import { FooterColumnList } from "./FooterColumnList";
import { FooterKeywordField } from "./FooterKeywordField";
import { useFocusEditorField } from "./useFocusEditorField";

type Tab = "script" | "links" | "follow";

type Props = {
  focusField?: string | null;
};

function tabFromFocus(focusField?: string | null): Tab {
  if (!focusField) return "script";
  if (focusField === "footer_script_word") return "script";
  if (focusField.startsWith("footer-link-")) return "links";
  return "script";
}

export function FooterPanel({ focusField }: Props) {
  const { data } = useCustomize();
  const rootRef = useFocusEditorField(focusField, "footer");
  const [tab, setTab] = useState<Tab>(() => tabFromFocus(focusField));

  useEffect(() => {
    setTab(tabFromFocus(focusField));
  }, [focusField]);

  if (!data.settings) {
    return <p className="text-sm text-[#8a8a8a]">No settings row.</p>;
  }

  const linksCol = FOOTER_COLUMNS[0];
  const followCol = FOOTER_COLUMNS[1];

  return (
    <EditorPanelShell>
      <div ref={rootRef} className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <EditorSectionHeader title="Footer" />
          <EditorOpenPageLink href="/#footer" />
        </div>
        <EditorSegmentTabs
          ariaLabel="Footer editor"
          value={tab}
          options={[
            { id: "script", label: "Script" },
            { id: "links", label: "Links" },
            { id: "follow", label: "Follow" },
          ]}
          onChange={setTab}
        />
        {tab === "script" ? (
          <div className="space-y-2">
            <p className="px-0.5 text-[10px] leading-relaxed text-[#8a8a8a]">
              Click the script keyword in the preview, or edit it here. Column
              titles stay fixed on the site.
            </p>
            <FooterKeywordField focusField={focusField} />
          </div>
        ) : null}
        {tab === "links" ? (
          <FooterColumnList
            title={linksCol.title}
            columnKey={linksCol.key}
            items={footerLinksForColumn(data, linksCol.key)}
          />
        ) : null}
        {tab === "follow" ? (
          <FooterColumnList
            title={followCol.title}
            columnKey={followCol.key}
            items={footerLinksForColumn(data, followCol.key)}
          />
        ) : null}
      </div>
    </EditorPanelShell>
  );
}
