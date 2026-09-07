"use client";

import type { Tables } from "@/lib/supabase/database.types";
import { repeatForInfiniteLoop } from "../lib/carouselAutoplay";
import { clientDisplayMode } from "../lib/clientDisplay";
import { HorizontalCarousel } from "./HorizontalCarousel";
import { MediaFigure } from "./MediaFigure";

type Client = Tables<"clients">;

type ClientsProps = {
  items: Client[];
  previewMode?: boolean;
};

function ClientContent({
  item,
  previewMode,
}: {
  item: Client;
  previewMode?: boolean;
}) {
  if (clientDisplayMode(item) === "image" && item.logo_url) {
    return (
      <MediaFigure
        src={item.logo_url}
        mediaType="image"
        alt={item.name}
        previewMode={previewMode}
      />
    );
  }
  return (
    <span className="clients-name" data-customize-field="name">
      {item.name}
    </span>
  );
}

function toColumns(items: Client[]) {
  const columns: Client[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    columns.push(items.slice(i, i + 2));
  }
  return columns;
}

export function ClientsSection({ items, previewMode }: ClientsProps) {
  if (!items.length) return null;
  const columns = toColumns(items);
  const loopColumns = previewMode
    ? columns
    : repeatForInfiniteLoop(columns, 16);

  return (
    <section
      className="brands-section"
      id="clients"
      data-customize-section="clients"
    >
      <div className="brands-header">
        <h2 className="section-heading center">Trusted by leading names</h2>
      </div>
      <HorizontalCarousel
        className="clients-carousel"
        label="Trusted brands"
        autoplay={!previewMode}
        autoplayDelayMs={2800}
        itemCount={loopColumns.length}
      >
        {loopColumns.map((column, index) => (
          <div
            key={`clients-col-${index}-${column.map((c) => c.id).join("-")}`}
            className="clients-col"
            data-carousel-card
          >
            {column.map((item) => (
              <div
                key={`${item.id}-${index}`}
                id={index < columns.length ? `customize-item-${item.id}` : undefined}
                className="clients-cell"
                data-customize-item={index < columns.length ? item.id : undefined}
                data-customize-field="logo_url"
                title={item.name}
              >
                <ClientContent item={item} previewMode={previewMode} />
              </div>
            ))}
          </div>
        ))}
      </HorizontalCarousel>
    </section>
  );
}
