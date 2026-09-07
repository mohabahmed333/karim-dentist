import type { TourGuide } from "./tourTypes";

/** Per-section content tours */
export const SECTION_TOUR_GUIDES: TourGuide[] = [
  {
    id: "hero",
    title: "Hero",
    description: "Homepage hero copy and media.",
    keywords: ["hero", "headline", "title image", "video", "cta", "kicker"],
    steps: [
      {
        id: "panel",
        title: "Hero editor",
        body: "Upload a script title image or use text, edit the top line, and switch media tabs. Changes show in the preview.",
        target: "[data-tour='section-panel']",
        placement: "right",
        ensureSection: "hero",
      },
    ],
  },
  {
    id: "about",
    title: "About",
    description: "Portrait, copy, and drop cap.",
    keywords: ["about", "portrait", "bio", "drop cap"],
    steps: [
      {
        id: "panel",
        title: "About editor",
        body: "Update the portrait, body copy, and drop-cap styling for the About section.",
        target: "[data-tour='section-panel']",
        placement: "right",
        ensureSection: "about",
      },
    ],
  },
  {
    id: "gallery",
    title: "Successful Cases",
    description: "Showcase and gallery grid images.",
    keywords: ["gallery", "images", "showcase"],
    steps: [
      {
        id: "panel",
        title: "Successful cases editor",
        body: "Manage gallery images in the admin gallery editor.",
        target: "[data-tour='section-panel']",
        placement: "right",
        ensureSection: "gallery",
      },
    ],
  },
  {
    id: "slider",
    title: "More Images",
    description: "Homepage image slider.",
    keywords: ["slider", "images", "carousel"],
    steps: [
      {
        id: "search",
        title: "Slider images",
        body: "Search or scroll the list, then open an item to edit its image.",
        target: "[data-tour='collection-search']",
        placement: "right",
        ensureSection: "slider",
        listView: true,
      },
    ],
  },
  {
    id: "contact",
    title: "Contact",
    description: "Contact section and booking details.",
    keywords: ["contact", "phone", "address", "booking"],
    steps: [
      {
        id: "panel",
        title: "Contact editor",
        body: "Edit phone, address, map link, and booking section copy.",
        target: "[data-tour='section-panel']",
        placement: "right",
        ensureSection: "contact",
      },
    ],
  },
  {
    id: "case-studies",
    title: "Case studies",
    description: "List, search, add, and edit case studies.",
    keywords: ["case", "studies", "portfolio", "work"],
    steps: [
      {
        id: "search",
        title: "Find a case study",
        body: "Search the list, then click a row to edit details and media.",
        target: "[data-tour='collection-search']",
        placement: "right",
        ensureSection: "case-studies",
        listView: true,
      },
      {
        id: "add",
        title: "Add a case study",
        body: "Use Add to create a new project, then fill in the detail fields.",
        target: "[data-tour='collection-add']",
        placement: "left",
        ensureSection: "case-studies",
        listView: true,
      },
    ],
  },
  {
    id: "case-studies-builder",
    title: "Case study page builder",
    description: "Build long-form case study layouts.",
    keywords: ["builder", "layout", "sections", "blocks", "case"],
    steps: [
      {
        id: "how",
        title: "Open the page builder",
        body: "Open a case study, then use Page builder to add and reorder layout blocks.",
        target: "[data-tour='editor']",
        placement: "right",
        ensureSection: "case-studies",
        listView: true,
      },
    ],
  },
  {
    id: "services",
    title: "Services",
    description: "Service rows, tags, and images.",
    keywords: ["services", "brand", "campaign", "content", "tags"],
    steps: [
      {
        id: "list",
        title: "Services list",
        body: "Search, add, or reorder services. Each row drives the homepage Services section.",
        target: "[data-tour='collection-list']",
        placement: "right",
        ensureSection: "services",
        listView: true,
      },
    ],
  },
  {
    id: "footer",
    title: "Footer",
    description: "Footer columns, links, and social.",
    keywords: ["footer", "links", "social", "columns", "keyword image", "tagline"],
    steps: [
      {
        id: "panel",
        title: "Footer editor",
        body: "Upload a script image or use text for the left keyword, then edit link columns and social links.",
        target: "[data-tour='section-panel']",
        placement: "right",
        ensureSection: "footer",
      },
    ],
  },
  {
    id: "settings-brand",
    title: "Brand settings",
    description: "Logo and brand name.",
    keywords: ["settings", "brand", "logo", "name"],
    steps: [
      {
        id: "brand",
        title: "Brand",
        body: "Upload the header logo and set the brand name fallback.",
        target: "[data-tour='section-panel']",
        placement: "right",
        ensureSection: "settings",
        settingsTab: "brand",
      },
    ],
  },
  {
    id: "settings-contact",
    title: "Contact settings",
    description: "Contact popup fields.",
    keywords: ["settings", "contact", "email", "phone", "popup"],
    steps: [
      {
        id: "contact",
        title: "Contact",
        body: "Edit emails, phones, address, and social URLs used in the contact popup.",
        target: "[data-tour='section-panel']",
        placement: "right",
        ensureSection: "settings",
        settingsTab: "contact",
      },
    ],
  },
  {
    id: "settings-order",
    title: "Homepage order",
    description: "Reorder homepage sections below Hero.",
    keywords: ["settings", "order", "homepage", "reorder", "drag"],
    steps: [
      {
        id: "order",
        title: "Homepage order",
        body: "Drag sections to change homepage order. Hero stays first — then Save.",
        target: "[data-tour='homepage-order']",
        placement: "right",
        ensureSection: "settings",
        settingsTab: "order",
      },
    ],
  },
];
