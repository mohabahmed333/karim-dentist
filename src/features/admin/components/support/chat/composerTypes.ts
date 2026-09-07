export type ComposerSendPayload = {
  kind:
    | "text"
    | "image"
    | "video"
    | "document"
    | "audio"
    | "location"
    | "contacts"
    | "interactive_buttons"
    | "interactive_cta";
  text?: string;
  file?: File;
  buttons?: { id: string; title: string }[];
  ctaLabel?: string;
  ctaUrl?: string;
  location?: {
    latitude: number;
    longitude: number;
    name: string;
    address: string;
  };
  replyTo?: {
    wamid: string;
    authorName: string;
    body: string;
    messageType?: string;
  };
  /** Optimistic local media preview */
  localMedia?: {
    url: string;
    mime?: string;
    name?: string;
    size?: number;
  }[];
  flow?: {
    kind?: string;
    title?: string;
    subtitle?: string;
    cta?: string;
    buttons?: { id: string; title: string }[];
    ctaUrl?: string;
    ctaLabel?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    phone?: string;
  } | null;
};
