import type { TourGuide } from "./tourTypes";

/** Shell / global tours */
export const SHELL_TOUR_GUIDES: TourGuide[] = [
  {
    id: "overview",
    title: "Customize overview",
    description: "Sections, editor, preview, devices, and save.",
    keywords: ["overview", "intro", "start", "welcome"],
    steps: [
      {
        id: "welcome",
        title: "Welcome to Customize",
        body: "Edit live. Changes stay local until you Save — Undo, Redo, or Discard anytime.",
      },
      {
        id: "sections",
        title: "Section tabs",
        body: "Jump between Hero, About, Case studies, Featured, Services, and more.",
        target: "[data-tour='section-nav']",
        placement: "bottom",
      },
      {
        id: "editor",
        title: "Editor sidebar",
        body: "Edit copy, media, and lists here. The preview updates as you type.",
        target: "[data-tour='editor']",
        placement: "right",
      },
      {
        id: "preview",
        title: "Live preview",
        body: "See the public site. Click in the preview to jump to that field.",
        target: "[data-tour='preview']",
        placement: "left",
      },
      {
        id: "devices",
        title: "Device sizes",
        body: "Preview Desktop, Tablet, or Mobile above the frame.",
        target: "[data-tour='devices']",
        placement: "bottom",
      },
      {
        id: "history",
        title: "Save & history",
        body: "Undo, Redo, Discard, or Save to publish. Shortcuts are on the buttons.",
        target: "[data-tour='history']",
        placement: "bottom",
      },
    ],
  },
  {
    id: "search-add",
    title: "Search & add items",
    description: "Find, create, and reorder collection items.",
    keywords: ["search", "filter", "add", "list", "reorder", "drag"],
    steps: [
      {
        id: "search",
        title: "Search items",
        body: "Type to filter the collection by name.",
        target: "[data-tour='collection-search']",
        placement: "right",
        ensureSection: "case-studies",
        listView: true,
      },
      {
        id: "add",
        title: "Add items",
        body: "Create a new item — it opens in the editor so you can fill it in.",
        target: "[data-tour='collection-add']",
        placement: "left",
        ensureSection: "case-studies",
        listView: true,
      },
      {
        id: "list",
        title: "Reorder & open",
        body: "Drag the handle to reorder, or click a row to edit.",
        target: "[data-tour='collection-list']",
        placement: "right",
        ensureSection: "case-studies",
        listView: true,
      },
    ],
  },
  {
    id: "preview-click",
    title: "Click-to-edit preview",
    description: "Select fields directly from the live preview.",
    keywords: ["preview", "click", "field", "jump"],
    steps: [
      {
        id: "preview",
        title: "Live preview",
        body: "Click text or media in the preview to open that field in the editor.",
        target: "[data-tour='preview']",
        placement: "left",
      },
    ],
  },
  {
    id: "devices",
    title: "Device preview",
    description: "Check layouts on different screen widths.",
    keywords: ["device", "mobile", "tablet", "desktop", "responsive"],
    steps: [
      {
        id: "devices",
        title: "Device sizes",
        body: "Switch Desktop, Tablet, or Mobile to check the layout.",
        target: "[data-tour='devices']",
        placement: "bottom",
      },
    ],
  },
  {
    id: "history",
    title: "Save & history",
    description: "Undo, redo, discard, and publish changes.",
    keywords: ["save", "undo", "redo", "discard", "publish", "shortcut"],
    steps: [
      {
        id: "history",
        title: "Save & history",
        body: "Undo and Redo draft steps, Discard to the last save, or Save to publish.",
        target: "[data-tour='history']",
        placement: "bottom",
      },
    ],
  },
];
