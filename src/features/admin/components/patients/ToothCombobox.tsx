"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  filterToothOptions,
  toothOptionByFdi,
  type ToothOption,
} from "./toothCatalog";

type Props = {
  fdi: string;
  disabled?: boolean;
  onSelect: (tooth: ToothOption) => void;
};

export function ToothCombobox({ fdi, disabled, onSelect }: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = toothOptionByFdi(fdi);
  const options = filterToothOptions(query);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          setQuery("");
          setOpen((v) => !v);
        }}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-lg bg-[#f2f2f2] px-3 text-start text-sm disabled:opacity-50"
      >
        <span className={selected ? "text-[#111827]" : "text-[#9ca3af]"}>
          {selected?.label ?? "Search or pick a tooth…"}
        </span>
        <ChevronDown className="size-4 shrink-0 text-[#6b7280]" />
      </button>

      {open ? (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-black/5">
          <div className="flex items-center gap-2 border-b border-[#f3f4f6] px-3 py-2">
            <Search className="size-3.5 text-[#9ca3af]" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="FDI or name…"
              className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <ul
            id={listId}
            role="listbox"
            className="max-h-56 overflow-y-auto py-1"
          >
            {options.length === 0 ? (
              <li className="px-3 py-2 text-sm text-[#9ca3af]">No matches</li>
            ) : (
              options.map((tooth) => (
                <li key={tooth.fdi} role="option" aria-selected={tooth.fdi === fdi}>
                  <button
                    type="button"
                    className={`w-full px-3 py-2 text-start text-sm hover:bg-[#f2f2f2] ${
                      tooth.fdi === fdi ? "bg-[#f2f2f2] font-medium" : ""
                    }`}
                    onClick={() => {
                      onSelect(tooth);
                      setOpen(false);
                    }}
                  >
                    {tooth.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
