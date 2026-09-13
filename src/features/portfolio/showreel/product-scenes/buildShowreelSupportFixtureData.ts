import type {
  SupportConversation,
  SupportDetails,
  SupportMessage,
} from "@/features/admin/components/support/supportDummyData";
import {
  WHATSAPP_ALL_MESSAGES,
  WHATSAPP_FIXTURE_CONVERSATIONS,
  type FixtureMessage,
} from "./fixtures";

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
