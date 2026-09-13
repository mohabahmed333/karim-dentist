export type SupportTagTone = "neutral" | "danger";

export type SupportConversation = {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  preview: string;
  timestamp: string;
  tags: { label: string; tone?: SupportTagTone }[];
  unread?: string;
  starred?: boolean;
  whatsapp?: boolean;
  checked?: boolean;
  assigneeId?: string | null;
  assigneeName?: string | null;
  mutedUntil?: string | null;
  muted?: boolean;
  workspaceHref?: string;
  profileHref?: string;
  phone?: string;
  patientKey?: string;
  status?: "active" | "ended" | "archived";
  lastMessageType?: string;
  lastMessageAt?: string;
  lastMessageStatus?: SupportMessage["status"];
  lastInboundAt?: string | null;
  sessionOpen?: boolean;
};

export type SupportMessage = {
  id: string;
  author: "customer" | "agent";
  authorName: string;
  body: string;
  time: string;
  read?: boolean;
  status?:
    | "draft"
    | "pending"
    | "received"
    | "sent"
    | "delivered"
    | "read"
    | "failed";
  /** AI-written and awaiting staff approval. Never delivered to the patient. */
  isDraft?: boolean;
  senderKind?: "human" | "ai" | "system";
  statusTimestamps?: {
    sent_at?: string;
    delivered_at?: string;
    read_at?: string;
    failed_at?: string;
  };
  messageType?: string;
  media?: {
    url: string;
    mime?: string;
    name?: string;
    size?: number;
    peaks?: number[];
  }[];
  flow?: {
    kind?: string;
    title?: string;
    subtitle?: string;
    cta?: string;
    fields?: string[];
    buttons?: { id: string; title: string }[];
    ctaUrl?: string;
    ctaLabel?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    phone?: string;
    /** The tapped button or list item's id, for a "button_reply" flow. */
    buttonId?: string;
    /** Whether a "button_reply" flow was a reply button or a list item. */
    replyKind?: "button" | "list";
  } | null;
  waTimestamp?: string;
  kapsoWamid?: string | null;
  replyTo?: {
    wamid: string;
    authorName: string;
    body: string;
    messageType?: string;
  } | null;
};

export type SupportNote = {
  id: string;
  author: string;
  body: string;
  pinned?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type SupportTicket = {
  id: string;
  title: string;
  creator: string;
  status: string;
};

export type SupportDetails = {
  attributes: { label: string; value: string }[];
  clientData: { label: string; value: string }[];
  tickets: SupportTicket[];
  notes: SupportNote[];
};

