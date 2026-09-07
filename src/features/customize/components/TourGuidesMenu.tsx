"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/lib/i18n";
import { filterTourGuides } from "../lib/customizeTour";

type Props = {
  onStartGuide: (id: string) => void;
};

export function TourGuidesMenu({ onStartGuide }: Props) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const guides = useMemo(() => filterTourGuides(query), [query]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;
      if (rootRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="rounded-[6px] px-2 py-1 text-[11px] text-[#6b6b6b] hover:bg-[#f0f0f0] hover:text-[#1a1a1a]"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        {t("admin.customize.tourGuides")}
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label={t("admin.customize.tourGuides")}
          className="absolute end-0 top-[calc(100%+6px)] z-[520] flex w-[min(320px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-xl border border-[#e5e5e5] bg-white shadow-[0_16px_40px_rgba(0,0,0,0.18)]"
        >
          <div className="border-b border-[#f0f0f0] p-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("admin.customize.searchTours")}
              aria-label="Search tour guides"
              autoFocus
              className="h-8 rounded-[6px] border-[#e5e5e5] bg-white text-xs shadow-none"
            />
          </div>
          <ul className="max-h-72 overflow-y-auto p-1">
            {guides.map((guide) => (
              <li key={guide.id}>
                <button
                  type="button"
                  className="flex w-full flex-col gap-0.5 rounded-[6px] px-2.5 py-2 text-start hover:bg-[#f5f5f5]"
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                    onStartGuide(guide.id);
                  }}
                >
                  <span className="text-[12px] font-medium text-[#1a1a1a]">
                    {guide.title}
                  </span>
                  <span className="text-[11px] leading-snug text-[#8a8a8a]">
                    {guide.description}
                  </span>
                </button>
              </li>
            ))}
            {guides.length === 0 ? (
              <li className="px-2.5 py-6 text-center text-[12px] text-[#8a8a8a]">
                No tours match “{query.trim()}”.
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
