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
  workspaceHref?: string;
  profileHref?: string;
  phone?: string;
  patientKey?: string;
  /** DB lifecycle: active | ended | archived */
  status?: "active" | "ended" | "archived";
  /** Last WhatsApp message type for inbox icons (image, audio, …). */
  lastMessageType?: string;
  /** ISO time of last message — used for newest sort. */
  lastMessageAt?: string;
  /** Delivery status of the last message (Kapso ticks for outbound). */
  lastMessageStatus?: SupportMessage["status"];
  /** Last inbound WhatsApp message ISO time (Meta 24h window). */
  lastInboundAt?: string | null;
  /** True while Meta customer-care window is open. */
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
    | "pending"
    | "received"
    | "sent"
    | "delivered"
    | "read"
    | "failed";
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
    kind?: "flow" | "buttons" | "cta" | "location" | "contacts" | string;
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
  } | null;
  waTimestamp?: string;
  /** Kapso WhatsApp message id — required to send a reply. */
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

export const SUPPORT_CONVERSATIONS: SupportConversation[] = [
  {
    id: "jasper",
    name: "Jasper Hargrove",
    initials: "JH",
    avatarColor: "#DBEAFE",
    preview: "I need help with my order and shipping timeline",
    timestamp: "19:45",
    tags: [{ label: "VIP User" }, { label: "Trusted" }],
    unread: "18",
    starred: true,
    whatsapp: true,
  },
  {
    id: "lena",
    name: "Lena Caldwell",
    initials: "LC",
    avatarColor: "#DCFCE7",
    preview: "Can you confirm the refund status for invoice #4821?",
    timestamp: "Yesterday",
    tags: [{ label: "Loyal" }],
    unread: "99+",
    starred: true,
  },
  {
    id: "samir",
    name: "Samir Blake",
    initials: "SB",
    avatarColor: "#FCE7F3",
    preview: "Ticket created for billing mismatch on account",
    timestamp: "Saturday",
    tags: [{ label: "Ticket created", tone: "danger" }],
    unread: "12",
    checked: true,
  },
  {
    id: "nora",
    name: "Nora Quinn",
    initials: "NQ",
    avatarColor: "#E0E7FF",
    preview: "Thanks for the quick response earlier today",
    timestamp: "27/11/25",
    tags: [{ label: "Trusted" }],
    unread: "2",
    whatsapp: true,
  },
  {
    id: "omar",
    name: "Omar Reyes",
    initials: "OR",
    avatarColor: "#FEF3C7",
    preview: "Is there an ETA for the replacement shipment?",
    timestamp: "26/11/25",
    tags: [{ label: "VIP User" }],
    starred: true,
  },
  {
    id: "priya",
    name: "Priya Nair",
    initials: "PN",
    avatarColor: "#F3E8FF",
    preview: "Following up on the onboarding checklist",
    timestamp: "25/11/25",
    tags: [{ label: "Loyal" }],
    checked: true,
  },
  {
    id: "theo",
    name: "Theo Marsh",
    initials: "TM",
    avatarColor: "#CCFBF1",
    preview: "Please share the warranty PDF again",
    timestamp: "24/11/25",
    tags: [{ label: "Ticket created", tone: "danger" }],
    unread: "4",
  },
  {
    id: "ava",
    name: "Ava Chen",
    initials: "AC",
    avatarColor: "#FFEDD5",
    preview: "Happy with the resolution — closing this out",
    timestamp: "23/11/25",
    tags: [{ label: "Trusted" }],
  },
];

export const SUPPORT_MESSAGES: Record<string, SupportMessage[]> = {
  jasper: [
    {
      id: "m1",
      author: "customer",
      authorName: "Jasper Hargrove",
      body: "Hi, I placed an order last week and still haven't received a tracking number.",
      time: "15.00",
    },
    {
      id: "m2",
      author: "agent",
      authorName: "Bruno Perez",
      body: "Hi Jasper — thanks for reaching out. I can see your order and I'm checking the carrier status now.",
      time: "15.00",
      read: true,
    },
    {
      id: "m3",
      author: "customer",
      authorName: "Jasper Hargrove",
      body: "Great, appreciate it. Also wondering if express shipping is still available for this order.",
      time: "15.02",
    },
    {
      id: "m4",
      author: "agent",
      authorName: "Bruno Perez",
      body: "Yes — I can upgrade you to express at no extra charge. I'll send the tracking link shortly.",
      time: "15.03",
      read: true,
    },
  ],
};

export const SUPPORT_DETAILS: Record<string, SupportDetails> = {
  jasper: {
    attributes: [
      { label: "Conversation ID", value: "#CNV-94821" },
      { label: "Channel Source", value: "WhatsApp" },
      { label: "Created at", value: "27 Nov 2025, 14:52" },
    ],
    clientData: [
      { label: "Name", value: "Jasper Hargrove" },
      { label: "Phone Number", value: "+62 812 3456 7890" },
      { label: "Email", value: "jasper.h@example.com" },
      { label: "Location", value: "Indonesia" },
      { label: "OS", value: "Windows 11" },
      { label: "Browser", value: "Chrome" },
    ],
    tickets: [
      {
        id: "t1",
        title: "Shipping delay investigation",
        creator: "Bruno Perez",
        status: "Not Started",
      },
      {
        id: "t2",
        title: "Express upgrade request",
        creator: "John Doe",
        status: "Not Started",
      },
      {
        id: "t3",
        title: "Carrier tracking missing",
        creator: "Bruno Perez",
        status: "Not Started",
      },
      {
        id: "t4",
        title: "VIP escalation follow-up",
        creator: "John Doe",
        status: "Not Started",
      },
      {
        id: "t5",
        title: "Refund eligibility check",
        creator: "Bruno Perez",
        status: "Not Started",
      },
    ],
    notes: [
      {
        id: "n1",
        author: "John Doe",
        body: "Scam",
        createdAt: "2026-09-01T10:00:00.000Z",
      },
      {
        id: "n2",
        author: "Bruno Perez",
        body: "Need attention",
        pinned: true,
        createdAt: "2026-09-02T14:30:00.000Z",
      },
    ],
  },
};

export function getMessages(id: string): SupportMessage[] {
  return SUPPORT_MESSAGES[id] ?? SUPPORT_MESSAGES.jasper;
}

export function getDetails(id: string): SupportDetails {
  return SUPPORT_DETAILS[id] ?? SUPPORT_DETAILS.jasper;
}
