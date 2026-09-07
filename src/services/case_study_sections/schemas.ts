import { z } from "zod";

export const SECTION_TYPES = [
  "title",
  "intro",
  "text",
  "media",
  "split",
  "text_grid",
  "grid",
  "columns",
] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

const mediaTypeSchema = z.enum(["image", "video"]);
const aspectRatioSchema = z.enum(["16/9", "4/3", "1/1", "3/4", "auto"]);

export const columnSlotSchema = z.object({
  kind: z.enum(["empty", "text", "media"]).default("empty"),
  heading: z.string().optional(),
  heading_ar: z.string().default(""),
  body: z.string().default(""),
  body_ar: z.string().default(""),
  media_url: z.string().nullable().default(null),
  media_type: mediaTypeSchema.default("image"),
  alt: z.string().default(""),
  aspect_ratio: aspectRatioSchema.default("1/1"),
});

export const titleContentSchema = z.object({
  title: z.string().default(""),
  title_ar: z.string().default(""),
  eyebrow: z.string().optional(),
  eyebrow_ar: z.string().default(""),
});

export const introContentSchema = z.object({
  label: z.string().default("Introduction"),
  label_ar: z.string().default(""),
  body: z.string().default(""),
  body_ar: z.string().default(""),
});

export const textContentSchema = z.object({
  heading: z.string().optional(),
  heading_ar: z.string().default(""),
  body: z.string().default(""),
  body_ar: z.string().default(""),
  width: z.enum(["narrow", "medium", "wide"]).default("medium"),
  align: z.enum(["left", "center"]).default("left"),
});

export const mediaContentSchema = z.object({
  media_url: z.string().nullable().default(null),
  media_type: mediaTypeSchema.default("image"),
  alt: z.string().default(""),
  caption: z.string().default(""),
  caption_ar: z.string().default(""),
  aspect_ratio: aspectRatioSchema.default("16/9"),
  object_position: z.string().default("center"),
});

export const splitContentSchema = z.object({
  heading: z.string().optional(),
  heading_ar: z.string().default(""),
  body: z.string().default(""),
  body_ar: z.string().default(""),
  media_url: z.string().nullable().default(null),
  media_type: mediaTypeSchema.default("image"),
  alt: z.string().default(""),
  media_position: z.enum(["left", "right"]).default("left"),
  ratio: z.enum(["40/60", "50/50"]).default("40/60"),
  media_aspect: z.enum(["16/9", "3/4", "1/1"]).default("16/9"),
});

export const gridItemSchema = z.object({
  media_url: z.string().nullable().default(null),
  media_type: mediaTypeSchema.default("image"),
  alt: z.string().default(""),
});

export const gridContentSchema = z.object({
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(2),
  items: z.array(gridItemSchema).min(1).max(4).default([]),
});

export const textGridContentSchema = z.object({
  heading: z.string().optional(),
  heading_ar: z.string().default(""),
  body: z.string().default(""),
  body_ar: z.string().default(""),
  text_position: z.enum(["left", "right"]).default("left"),
  items: z
    .array(gridItemSchema)
    .length(4)
    .default(() => [
      gridItemSchema.parse({}),
      gridItemSchema.parse({}),
      gridItemSchema.parse({}),
      gridItemSchema.parse({}),
    ]),
});

export const columnsContentSchema = z.object({
  slots: z.array(columnSlotSchema).length(3),
});

export const sectionContentSchemas = {
  title: titleContentSchema,
  intro: introContentSchema,
  text: textContentSchema,
  media: mediaContentSchema,
  split: splitContentSchema,
  text_grid: textGridContentSchema,
  grid: gridContentSchema,
  columns: columnsContentSchema,
} as const;

export type ColumnSlot = z.infer<typeof columnSlotSchema>;
export type TitleContent = z.infer<typeof titleContentSchema>;
export type IntroContent = z.infer<typeof introContentSchema>;
export type TextContent = z.infer<typeof textContentSchema>;
export type MediaContent = z.infer<typeof mediaContentSchema>;
export type SplitContent = z.infer<typeof splitContentSchema>;
export type GridContent = z.infer<typeof gridContentSchema>;
export type TextGridContent = z.infer<typeof textGridContentSchema>;
export type ColumnsContent = z.infer<typeof columnsContentSchema>;
export type SectionContent =
  | TitleContent
  | IntroContent
  | TextContent
  | MediaContent
  | SplitContent
  | TextGridContent
  | GridContent
  | ColumnsContent;

const emptySlot = (): ColumnSlot =>
  columnSlotSchema.parse({ kind: "empty" });

const emptyGridItem = () => gridItemSchema.parse({});

export function defaultContentForType(type: SectionType): SectionContent {
  if (type === "title") return titleContentSchema.parse({ title: "" });
  if (type === "intro") {
    return introContentSchema.parse({ label: "Introduction", body: "" });
  }
  if (type === "text") return textContentSchema.parse({ body: "" });
  if (type === "media") return mediaContentSchema.parse({});
  if (type === "split") return splitContentSchema.parse({});
  if (type === "text_grid") {
    return textGridContentSchema.parse({
      body: "",
      items: [emptyGridItem(), emptyGridItem(), emptyGridItem(), emptyGridItem()],
    });
  }
  if (type === "columns") {
    return columnsContentSchema.parse({
      slots: [emptySlot(), emptySlot(), emptySlot()],
    });
  }
  return gridContentSchema.parse({
    columns: 3,
    items: [emptyGridItem(), emptyGridItem(), emptyGridItem()],
  });
}

export function parseSectionContent(
  type: SectionType,
  raw: unknown,
): SectionContent {
  return sectionContentSchemas[type].parse(raw ?? {});
}
