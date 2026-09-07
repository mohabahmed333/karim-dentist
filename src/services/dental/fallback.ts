import type {
  GalleryComparison,
  GalleryItem,
  GalleryShowcase,
  SolutionPanel,
  TrustItem,
} from "./types";

export const dentalTrustFallback: TrustItem[] = [
  {
    id: "1",
    value: "Laser-focused",
    label: "Precision care",
    value_ar: "",
    label_ar: "",
    sort_order: 0,
  },
  {
    id: "2",
    value: "New Cairo",
    label: "Ozone Medical Center",
    value_ar: "",
    label_ar: "",
    sort_order: 1,
  },
  {
    id: "3",
    value: "Comfort-first",
    label: "Patient experience",
    value_ar: "",
    label_ar: "",
    sort_order: 2,
  },
];

export const dentalSolutionsFallback: SolutionPanel[] = [
  {
    id: "1",
    variant: "dark",
    title: "Laser dentistry solution",
    title_ar: "",
    body: "Precise, comfort-first laser treatments for gum reshaping, whitening support, and faster healing.",
    body_ar: "",
    image_url: "/dental/769375317_18084823622253727_452713876016021475_n.jpg",
    link_href: "#gallery",
    sort_order: 0,
  },
  {
    id: "2",
    variant: "photo",
    title: "Find the right dentist for you",
    title_ar: "",
    body: "",
    body_ar: "",
    image_url: "/dental/769385837_18084847031253727_8666198053893142707_n.jpg",
    link_href: "#contact",
    sort_order: 1,
  },
  {
    id: "3",
    variant: "dark",
    title: "Smile results with precision",
    title_ar: "",
    body: "Because every smile deserves careful planning, modern tools, and confident results.",
    body_ar: "",
    image_url: "/dental/772697015_18085465295253727_2050281078110971810_n.jpg",
    link_href: "#gallery",
    sort_order: 2,
  },
];

export const dentalGalleryShowcaseFallback: GalleryShowcase = {
  id: "1",
  image_url: "/dental/771453934_18084846845253727_4216909913248468130_n.jpg",
  alt_text: "Before, during, and after orthodontic smile result",
};

export const dentalGalleryComparisonsFallback: GalleryComparison[] = [
  {
    id: "1",
    before_image_url:
      "/dental/774361792_18086030342253727_5992595618828369379_n.jpg",
    after_image_url:
      "/dental/771453934_18084846845253727_4216909913248468130_n.jpg",
    alt_text: "Before and after smile whitening result",
    sort_order: 0,
    is_published: true,
  },
];

export const dentalGalleryItemsFallback: GalleryItem[] = [
  {
    id: "1",
    image_url: "/dental/769385837_18084847031253727_8666198053893142707_n.jpg",
    caption: "Meet Dr. Karim Elshibiny",
    caption_ar: "",
    category: "clinic",
    sort_order: 0,
    is_published: true,
  },
  {
    id: "2",
    image_url: "/dental/769375317_18084823622253727_452713876016021475_n.jpg",
    caption: "Laser Technology",
    caption_ar: "",
    category: "technology",
    sort_order: 1,
    is_published: true,
  },
  {
    id: "3",
    image_url: "/dental/774361792_18086030342253727_5992595618828369379_n.jpg",
    caption: "Frenectomy Result",
    caption_ar: "",
    category: "results",
    sort_order: 2,
    is_published: true,
  },
];

export const dentalSliderImagesFallback = [
  "/dental/771844919_18084846794253727_2495961933820976843_n.jpg",
  "/dental/771892527_18084817961253727_5445355793744516179_n.jpg",
  "/dental/771892527_18084898616253727_5560745852592328857_n.jpg",
  "/dental/771997664_18085564919253727_2931628136836544374_n.jpg",
  "/dental/771998510_18084989687253727_611893741829188574_n.jpg",
  "/dental/772373432_18085267421253727_8239745368432957963_n.jpg",
  "/dental/772401978_18085208630253727_984276698240454703_n.jpg",
  "/dental/772697015_18085465295253727_2050281078110971810_n.jpg",
  "/dental/772714531_18085751501253727_988432266487528892_n.jpg",
  "/dental/774744788_18086374004253727_6769576540960911746_n.jpg",
];
