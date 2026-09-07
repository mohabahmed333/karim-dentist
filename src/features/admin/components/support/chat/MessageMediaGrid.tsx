"use client";

import { useState } from "react";
import { Download, X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { url: string; name?: string };

type Props = {
  items: Item[];
};

export function MessageMediaGrid({ items }: Props) {
  const [active, setActive] = useState<Item | null>(null);
  if (!items.length) return null;

  return (
    <>
      <div
        className={cn(
          "mb-2 grid gap-1.5",
          items.length === 1 ? "grid-cols-1" : "grid-cols-2",
        )}
      >
        {items.map((item, index) => (
          <button
            key={item.url}
            type="button"
            onClick={() => setActive(item)}
            className={cn(
              "group relative overflow-hidden rounded-lg bg-[#E5E7EB]",
              items.length > 1 &&
                items.length % 2 === 1 &&
                index === items.length - 1 &&
                "col-span-2",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt={item.name ?? "Attachment"}
              className={cn(
                "w-full object-cover",
                items.length === 1 ? "max-h-64" : "h-28",
              )}
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/20 group-hover:opacity-100">
              <ZoomIn className="h-5 w-5 text-white" />
            </span>
          </button>
        ))}
      </div>
      {active ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          role="dialog"
          aria-modal
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white"
            onClick={() => setActive(null)}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={active.url}
            alt={active.name ?? "Attachment"}
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
          />
          <a
            href={active.url}
            download={active.name ?? "image"}
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-6 right-6 inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-[#111827]"
          >
            <Download className="h-4 w-4" />
            Download
          </a>
        </div>
      ) : null}
    </>
  );
}
