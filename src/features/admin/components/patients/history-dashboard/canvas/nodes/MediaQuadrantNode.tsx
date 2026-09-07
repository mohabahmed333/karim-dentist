"use client";

import { ImageIcon } from "lucide-react";
import { CbctSlice } from "../../CbctSlice";
import type { MediaFile } from "../canvas.types";

type Props = { title: string; mediaFiles?: MediaFile[]; onOpen?: () => void };

function SlotCell({ slot, index }: { slot?: MediaFile; index: 0 | 1 | 2 | 3 }) {
  if (!slot) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl bg-white/5">
        <CbctSlice variant={index} />
      </div>
    );
  }
  if (slot.kind === "video") {
    return (
      <video
        src={slot.url}
        className="aspect-square w-full rounded-xl object-cover"
        muted
        playsInline
        loop
        autoPlay
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={slot.url}
      alt={`Media ${index + 1}`}
      className="aspect-square w-full rounded-xl object-cover"
    />
  );
}

export function MediaQuadrantNode({ title, mediaFiles, onOpen }: Props) {
  return (
    <article
      className="w-[280px] cursor-pointer rounded-3xl bg-[#111111] p-4 text-white shadow-xl"
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onOpen?.();
      }}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="px-1 text-[12px] text-white/70">{title}</p>
        {mediaFiles && mediaFiles.length > 0 && (
          <ImageIcon className="mt-0.5 size-3.5 shrink-0 text-white/40" />
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-1.5 overflow-hidden rounded-2xl">
        {([0, 1, 2, 3] as const).map((i) => (
          <SlotCell key={i} index={i} slot={mediaFiles?.[i]} />
        ))}
      </div>
    </article>
  );
}
