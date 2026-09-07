export type TrustItem = {
  id: string;
  value: string;
  label: string;
  value_ar?: string;
  label_ar?: string;
  sort_order: number;
};

export type SolutionPanel = {
  id: string;
  variant: "dark" | "photo";
  title: string;
  body: string;
  title_ar?: string;
  body_ar?: string;
  image_url: string;
  link_href: string | null;
  sort_order: number;
};

export type GalleryItem = {
  id: string;
  image_url: string;
  caption: string;
  caption_ar?: string;
  category: string;
  sort_order: number;
  is_published: boolean;
};

export type GalleryShowcase = {
  id: string;
  image_url: string;
  alt_text: string;
};

export type GalleryComparison = {
  id: string;
  before_image_url: string;
  after_image_url: string;
  alt_text: string;
  sort_order: number;
  is_published: boolean;
};
