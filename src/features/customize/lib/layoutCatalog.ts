import {
  defaultContentForType,
  type ColumnSlot,
  type SectionContent,
  type SectionType,
} from "@/services/case_study_sections";

export type LayoutPreviewKey =
  | "title"
  | "intro"
  | "text"
  | "text-center"
  | "media"
  | "media-square"
  | "media-portrait"
  | "split"
  | "split-right"
  | "split-portrait"
  | "text-grid"
  | "text-grid-right"
  | "grid-2"
  | "grid-3"
  | "grid-4"
  | "columns";

export type LayoutCatalogItem = {
  id: string;
  type: SectionType;
  label: string;
  description: string;
  preview: LayoutPreviewKey;
  layoutVariant?: string;
  content?: SectionContent;
};

function withContent(
  type: SectionType,
  partial: Record<string, unknown>,
): SectionContent {
  return { ...defaultContentForType(type), ...partial } as SectionContent;
}

function emptyItems(count: number) {
  return Array.from({ length: count }, () => ({}));
}

function slot(
  kind: ColumnSlot["kind"],
  aspect: ColumnSlot["aspect_ratio"] = "1/1",
): ColumnSlot {
  return {
    kind,
    heading: "",
    heading_ar: "",
    body: "",
    body_ar: "",
    media_url: null,
    media_type: "image",
    alt: "",
    aspect_ratio: aspect,
  };
}

function buildCatalog(): LayoutCatalogItem[] {
  const items: LayoutCatalogItem[] = [];

  const push = (item: LayoutCatalogItem) => {
    if (items.length < 100) items.push(item);
  };

  const titles = [
    ["title", "Title", "Large project title"],
    ["title-eyebrow", "Title + eyebrow", "Title with small eyebrow above"],
    ["title-hero", "Hero title", "Oversized opening title"],
    ["title-minimal", "Minimal title", "Quiet title for mid-page breaks"],
  ] as const;
  for (const [id, label, description] of titles) {
    push({
      id,
      type: "title",
      label,
      description,
      preview: "title",
      layoutVariant: id,
      content: withContent("title", {
        title: "",
        eyebrow: id.includes("eyebrow") ? "Case study" : undefined,
      }),
    });
  }

  const intros = [
    ["intro", "Introduction", "Label left, body right"],
    ["intro-overview", "Overview", "Overview label with body copy"],
    ["intro-brief", "Brief", "Brief label with project summary"],
    ["intro-story", "Story", "Story label with narrative copy"],
    ["intro-context", "Context", "Context label with background copy"],
    ["intro-outcome", "Outcome", "Outcome label with results copy"],
  ] as const;
  for (const [id, label, description] of intros) {
    push({
      id,
      type: "intro",
      label,
      description,
      preview: "intro",
      layoutVariant: id,
      content: withContent("intro", { label, body: "" }),
    });
  }

  for (const width of ["narrow", "medium", "wide"] as const) {
    for (const align of ["left", "center"] as const) {
      const id = `text-${width}-${align}`;
      push({
        id,
        type: "text",
        label: `Text ${width} ${align}`,
        description: `${width} text block, ${align} aligned`,
        preview: align === "center" ? "text-center" : "text",
        layoutVariant: id,
        content: withContent("text", { width, align }),
      });
    }
  }
  for (const [id, label, description] of [
    ["text-lead", "Lead paragraph", "Opening lead copy"],
    ["text-quote", "Quote block", "Centered quote-style text"],
    ["text-caption", "Caption text", "Small supporting caption"],
    ["text-note", "Note", "Side note style text"],
  ] as const) {
    push({
      id,
      type: "text",
      label,
      description,
      preview: id === "text-quote" ? "text-center" : "text",
      layoutVariant: id,
      content: withContent("text", {
        width: id === "text-caption" ? "narrow" : "medium",
        align: id === "text-quote" ? "center" : "left",
      }),
    });
  }

  const aspects = ["16/9", "4/3", "1/1", "3/4", "auto"] as const;
  const positions = ["center", "top", "bottom", "left", "right"] as const;
  for (const aspect of aspects) {
    for (const object_position of positions) {
      const preview: LayoutPreviewKey =
        aspect === "1/1"
          ? "media-square"
          : aspect === "3/4"
            ? "media-portrait"
            : "media";
      push({
        id: `media-${aspect.replace("/", "-")}-${object_position}`,
        type: "media",
        label: `Media ${aspect} · ${object_position}`,
        description: `${aspect} media cropped to ${object_position}`,
        preview,
        layoutVariant: `media-${aspect}-${object_position}`,
        content: withContent("media", { aspect_ratio: aspect, object_position }),
      });
    }
  }

  for (const media_position of ["left", "right"] as const) {
    for (const ratio of ["40/60", "50/50"] as const) {
      for (const media_aspect of ["16/9", "3/4", "1/1"] as const) {
        const preview: LayoutPreviewKey =
          media_aspect === "3/4"
            ? "split-portrait"
            : media_position === "right"
              ? "split-right"
              : "split";
        const side = media_position === "left" ? "Media + text" : "Text + media";
        push({
          id: `split-${media_position}-${ratio.replace("/", "-")}-${media_aspect.replace("/", "-")}`,
          type: "split",
          label: `${side} · ${ratio} · ${media_aspect}`,
          description: `Split ${ratio} with ${media_aspect} media on the ${media_position}`,
          preview,
          layoutVariant: `split-${media_position}-${ratio}-${media_aspect}`,
          content: withContent("split", {
            media_position,
            ratio,
            media_aspect,
          }),
        });
      }
    }
  }

  for (const text_position of ["left", "right"] as const) {
    for (const tone of ["default", "editorial", "compact", "airy"] as const) {
      push({
        id: `text-grid-${text_position}-${tone}`,
        type: "text_grid",
        label:
          text_position === "left"
            ? `Text + grid · ${tone}`
            : `Grid + text · ${tone}`,
        description: `2×2 grid with text on the ${text_position} (${tone})`,
        preview: text_position === "right" ? "text-grid-right" : "text-grid",
        layoutVariant: `text-grid-${text_position}-${tone}`,
        content: withContent("text_grid", { text_position }),
      });
    }
  }

  for (const columns of [2, 3, 4] as const) {
    for (const density of ["default", "tight", "loose"] as const) {
      const preview: LayoutPreviewKey =
        columns === 2 ? "grid-2" : columns === 3 ? "grid-3" : "grid-4";
      push({
        id: `grid-${columns}-${density}`,
        type: "grid",
        label: `${columns}-up grid · ${density}`,
        description: `${columns} equal media tiles (${density} spacing)`,
        preview,
        layoutVariant: `grid-${columns}-${density}`,
        content: withContent("grid", {
          columns,
          items: emptyItems(columns),
        }),
      });
    }
  }

  for (const [id, label, description, columns] of [
    ["grid-mosaic-2", "Pair mosaic", "Two featured media tiles", 2],
    ["grid-gallery-3", "Gallery row", "Three gallery squares", 3],
    ["grid-strip-4", "Film strip", "Four-frame strip", 4],
    ["grid-feature-2", "Feature pair", "Two large feature frames", 2],
    ["grid-proof-3", "Proof row", "Three detail proofs", 3],
  ] as const) {
    const preview: LayoutPreviewKey =
      columns === 2 ? "grid-2" : columns === 3 ? "grid-3" : "grid-4";
    push({
      id,
      type: "grid",
      label,
      description,
      preview,
      layoutVariant: id,
      content: withContent("grid", {
        columns,
        items: emptyItems(columns),
      }),
    });
  }

  const columnPresets: Array<{
    id: string;
    label: string;
    description: string;
    kinds: [ColumnSlot["kind"], ColumnSlot["kind"], ColumnSlot["kind"]];
  }> = [
    {
      id: "columns-blank",
      label: "3 blank columns",
      description: "Three empty slots ready to fill",
      kinds: ["empty", "empty", "empty"],
    },
    {
      id: "columns-text-text-text",
      label: "3 text columns",
      description: "Three text columns side by side",
      kinds: ["text", "text", "text"],
    },
    {
      id: "columns-media-media-media",
      label: "3 media columns",
      description: "Three media tiles in a row",
      kinds: ["media", "media", "media"],
    },
    {
      id: "columns-text-media-media",
      label: "Text + 2 media",
      description: "Text then two media slots",
      kinds: ["text", "media", "media"],
    },
    {
      id: "columns-media-text-media",
      label: "Media · text · media",
      description: "Text sandwiched between media",
      kinds: ["media", "text", "media"],
    },
    {
      id: "columns-media-media-text",
      label: "2 media + text",
      description: "Two media slots then text",
      kinds: ["media", "media", "text"],
    },
    {
      id: "columns-text-media-empty",
      label: "Text · media · empty",
      description: "Asymmetric text and media",
      kinds: ["text", "media", "empty"],
    },
    {
      id: "columns-empty-text-media",
      label: "Empty · text · media",
      description: "Offset text and media columns",
      kinds: ["empty", "text", "media"],
    },
    {
      id: "columns-media-empty-text",
      label: "Media · empty · text",
      description: "Media and text with a spacer",
      kinds: ["media", "empty", "text"],
    },
    {
      id: "columns-text-empty-text",
      label: "Text · empty · text",
      description: "Two text columns with a gap",
      kinds: ["text", "empty", "text"],
    },
    {
      id: "columns-portrait-row",
      label: "3 portrait media",
      description: "Three portrait media columns",
      kinds: ["media", "media", "media"],
    },
    {
      id: "columns-square-row",
      label: "3 square media",
      description: "Three square media columns",
      kinds: ["media", "media", "media"],
    },
    {
      id: "columns-text-text-media",
      label: "2 text + media",
      description: "Two text columns and one media",
      kinds: ["text", "text", "media"],
    },
    {
      id: "columns-media-text-text",
      label: "Media + 2 text",
      description: "One media and two text columns",
      kinds: ["media", "text", "text"],
    },
    {
      id: "columns-empty-media-media",
      label: "Spacer + 2 media",
      description: "Offset pair of media columns",
      kinds: ["empty", "media", "media"],
    },
    {
      id: "columns-media-media-empty",
      label: "2 media + spacer",
      description: "Media pair with trailing space",
      kinds: ["media", "media", "empty"],
    },
    {
      id: "columns-text-empty-media",
      label: "Text · spacer · media",
      description: "Separated text and media columns",
      kinds: ["text", "empty", "media"],
    },
    {
      id: "columns-empty-empty-text",
      label: "Offset text",
      description: "Text pushed to the third column",
      kinds: ["empty", "empty", "text"],
    },
    {
      id: "columns-text-empty-empty",
      label: "Lead text column",
      description: "Text in the first column only",
      kinds: ["text", "empty", "empty"],
    },
    {
      id: "columns-empty-media-empty",
      label: "Center media",
      description: "Single media column in the middle",
      kinds: ["empty", "media", "empty"],
    },
    {
      id: "columns-empty-text-empty",
      label: "Center text",
      description: "Single text column in the middle",
      kinds: ["empty", "text", "empty"],
    },
  ];

  for (const preset of columnPresets) {
    const aspect =
      preset.id === "columns-portrait-row"
        ? ("3/4" as const)
        : preset.id === "columns-square-row"
          ? ("1/1" as const)
          : ("1/1" as const);
    push({
      id: preset.id,
      type: "columns",
      label: preset.label,
      description: preset.description,
      preview: "columns",
      layoutVariant: preset.id,
      content: withContent("columns", {
        slots: preset.kinds.map((kind) => slot(kind, aspect)),
      }),
    });
  }

  return items.slice(0, 100);
}

export const LAYOUT_CATALOG: LayoutCatalogItem[] = buildCatalog();

export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  title: "Title",
  intro: "Introduction",
  text: "Text",
  media: "Full media",
  split: "Text + media",
  text_grid: "Text + grid",
  grid: "Image grid",
  columns: "3 columns",
};
