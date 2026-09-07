"use client";

import { ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatGallery } from "./ChatGalleryContext";

type Item = { url: string; name?: string };

type Props = {
  items: Item[];
};

export function MessageMediaGrid({ items }: Props) {
  const gallery = useChatGallery();
  if (!items.length) return null;

  function open(item: Item) {
    if (gallery) {
      gallery.openAtUrl(item.url);
      return;
    }
  }

  return (
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
          onClick={() => open(item)}
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
  );
}
