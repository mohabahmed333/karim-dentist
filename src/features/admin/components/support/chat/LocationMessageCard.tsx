"use client";

import { MapPin } from "lucide-react";
import {
  locationMapsUrl,
  locationStaticMapUrl,
} from "./locationMap";

type Props = {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
};

export function LocationMessageCard({
  name,
  address,
  latitude,
  longitude,
}: Props) {
  const hasCoords =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  const mapsHref = hasCoords
    ? locationMapsUrl(latitude, longitude)
    : address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
      : undefined;

  const inner = (
    <div className="mb-2 min-w-[220px] max-w-[280px] overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#111827] text-left shadow-sm">
      <div className="relative h-[140px] w-full bg-[#0B1220]">
        {hasCoords ? (
          // eslint-disable-next-line @next/next/no-img-element -- external OSM static
          <img
            src={locationStaticMapUrl(latitude, longitude)}
            alt=""
            className="h-full w-full object-cover brightness-[0.72] contrast-125 saturate-75"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[#1F2937]">
            <MapPin className="h-8 w-8 text-[#EF4444]" />
          </div>
        )}
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center drop-shadow-md">
          <MapPin className="h-8 w-8 fill-[#EF4444] text-[#EF4444]" />
        </span>
      </div>
      <div className="space-y-0.5 px-3 py-2.5">
        <p className="truncate text-sm font-semibold text-white">
          {name?.trim() || "Location"}
        </p>
        {address ? (
          <p className="line-clamp-2 text-xs leading-snug text-[#9CA3AF]">
            {address}
          </p>
        ) : null}
      </div>
    </div>
  );

  if (!mapsHref) return inner;

  return (
    <a
      href={mapsHref}
      target="_blank"
      rel="noreferrer"
      className="block outline-none focus-visible:ring-2 focus-visible:ring-[#93C5FD]"
      aria-label={`Open ${name ?? "location"} in Maps`}
    >
      {inner}
    </a>
  );
}
