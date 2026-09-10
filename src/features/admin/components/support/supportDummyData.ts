import {
  WHATSAPP_ALL_MESSAGES,
  WHATSAPP_FIXTURE_CONVERSATIONS,
  type FixtureMessage,
} from "@/features/portfolio/showreel/product-scenes/fixtures";

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

function toSupportMessage(msg: FixtureMessage): SupportMessage {
  return {
    id: msg.id,
    author: msg.author,
    authorName: msg.authorName,
    body: msg.body,
    time: msg.time,
    status: msg.status,
    read: msg.status === "read",
    messageType: msg.messageType,
    media: msg.media,
    flow: (msg.flow as SupportMessage["flow"]) ?? null,
    replyTo: msg.replyTo
      ? {
          wamid: msg.replyTo.wamid,
          authorName: msg.replyTo.authorName,
          body: msg.replyTo.body,
        }
      : null,
  };
}

export const SUPPORT_CONVERSATIONS: SupportConversation[] =
  WHATSAPP_FIXTURE_CONVERSATIONS.map((c) => ({
    id: c.id,
    name: c.name,
    initials: c.initials,
    avatarColor: c.avatarColor,
    preview: c.preview,
    timestamp: c.timestamp,
    tags: c.tags,
    unread: c.unread,
    starred: c.starred,
    whatsapp: true,
    phone: c.phone,
    patientKey: c.patientKey,
    status: c.status,
    lastMessageType: c.lastMessageType,
    lastMessageStatus: c.lastMessageStatus as SupportMessage["status"],
    lastInboundAt: c.lastInboundAt ?? null,
    sessionOpen: c.status === "active",
    workspaceHref: `/admin/patients/${encodeURIComponent(c.patientKey)}`,
    profileHref: `/admin/patients/${encodeURIComponent(c.patientKey)}`,
  }));

export const SUPPORT_MESSAGES: Record<string, SupportMessage[]> =
  Object.fromEntries(
    Object.entries(WHATSAPP_ALL_MESSAGES).map(([id, msgs]) => [
      id,
      msgs.map(toSupportMessage),
    ]),
  );

const defaultDetails = (name: string, phone: string): SupportDetails => ({
  attributes: [
    { label: "Channel", value: "WhatsApp" },
    { label: "Clinic", value: "Dental Lounge" },
  ],
  clientData: [
    { label: "Name", value: name },
    { label: "Phone", value: phone },
  ],
  tickets: [
    {
      id: "t-demo",
      title: "Front desk follow-up",
      creator: "Front desk",
      status: "Not Started",
    },
  ],
  notes: [
    {
      id: "n-demo",
      author: "Front desk",
      body: "Demo patient — showreel seed",
      pinned: true,
      createdAt: new Date().toISOString(),
    },
  ],
});

export const SUPPORT_DETAILS: Record<string, SupportDetails> =
  Object.fromEntries(
    WHATSAPP_FIXTURE_CONVERSATIONS.map((c) => [
      c.id,
      defaultDetails(c.name, c.phone),
    ]),
  );

export function getMessages(id: string): SupportMessage[] {
  const first = SUPPORT_CONVERSATIONS[0]?.id;
  return SUPPORT_MESSAGES[id] ?? (first ? SUPPORT_MESSAGES[first] ?? [] : []);
}

export function getDetails(id: string): SupportDetails {
  const first = SUPPORT_CONVERSATIONS[0]?.id;
  return (
    SUPPORT_DETAILS[id] ??
    (first ? SUPPORT_DETAILS[first]! : defaultDetails("Patient", ""))
  );
}
