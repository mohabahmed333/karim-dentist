"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import type { PortfolioData } from "@/services/portfolio";
import type { FooterColumnKey } from "@/services/footer_links/types";
import type { CollectionSection, SaveStatus } from "../types";
import { createCollectionRow, deleteCollectionRow } from "./collectionCrud";
import { footerLinksForColumn } from "../lib/footerColumns";
import { isReservedFooterLink } from "@/features/portfolio/lib/footerLinkHref";
import { listKey } from "./dataHelpers";

type SetData = Dispatch<SetStateAction<PortfolioData>>;

export function useCollectionActions(
  data: PortfolioData,
  setData: SetData,
  setSnapshot: SetData,
  setStatus: Dispatch<SetStateAction<SaveStatus>>,
) {
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const add = useCallback(
    async (
      section: CollectionSection,
      footerColumn: FooterColumnKey = "portfolio",
    ): Promise<string | null> => {
      setStatus("saving");
      try {
        const sort_order = maxSort(dataRef.current, section, footerColumn) + 1;
        const row = await createCollectionRow(section, sort_order, footerColumn);
        setData((d) => appendRow(d, section, row));
        setSnapshot((s) => appendRow(s, section, row));
        setStatus("saved");
        return String(row.id);
      } catch (err) {
        setStatus("error");
        toast.error(err instanceof Error ? err.message : "Create failed");
        return null;
      }
    },
    [setData, setSnapshot, setStatus],
  );

  const addFooterLink = useCallback(
    (columnKey: FooterColumnKey) => add("footer", columnKey),
    [add],
  );

  const remove = useCallback(
    async (section: CollectionSection, id: string) => {
      if (section === "footer") {
        const link = dataRef.current.footerLinks.find((i) => i.id === id);
        if (link && isReservedFooterLink(link)) {
          toast.error("The Contact footer link cannot be removed.");
          return;
        }
      }
      setStatus("saving");
      try {
        const isSocial = dataRef.current.socialLinks.some((i) => i.id === id);
        await deleteCollectionRow(section, id, isSocial);
        setData((d) => dropRow(d, section, id));
        setSnapshot((s) => dropRow(s, section, id));
        setStatus("saved");
      } catch (err) {
        setStatus("error");
        toast.error(err instanceof Error ? err.message : "Delete failed");
      }
    },
    [setData, setSnapshot, setStatus],
  );

  return useMemo(() => ({ add, addFooterLink, remove }), [add, addFooterLink, remove]);
}

function maxSort(
  data: PortfolioData,
  section: CollectionSection,
  footerColumn: FooterColumnKey = "portfolio",
): number {
  if (section === "footer") {
    return footerLinksForColumn(data, footerColumn).reduce(
      (m, i) => Math.max(m, i.sort_order),
      0,
    );
  }
  const list = data[listKey(section)] as Array<{ sort_order: number }>;
  return list.reduce((m, i) => Math.max(m, i.sort_order), 0);
}

function appendRow(
  data: PortfolioData,
  section: CollectionSection,
  row: { id: string },
): PortfolioData {
  if (section === "footer") {
    return { ...data, footerLinks: [...data.footerLinks, row as never] };
  }
  const key = listKey(section);
  return { ...data, [key]: [...(data[key] as unknown[]), row] };
}

function dropRow(
  data: PortfolioData,
  section: CollectionSection,
  id: string,
): PortfolioData {
  if (section === "footer") {
    return {
      ...data,
      footerLinks: data.footerLinks.filter((i) => i.id !== id),
      socialLinks: data.socialLinks.filter((i) => i.id !== id),
    };
  }
  const key = listKey(section);
  const list = data[key] as Array<{ id: string }>;
  return { ...data, [key]: list.filter((i) => i.id !== id) };
}
