import {
  buildPatientHistoryDetail,
  buildPatientHistoryStats,
  findPatientGroupByPhone,
  formatPatientVisitDate,
  getPatientGroup,
  patientProfilePath,
  patientWorkspacePath,
  type PatientGroup,
} from "@/services/reservations/patientHistory";
import type {
  WhatsappConversation,
  WhatsappMessage,
  WhatsappNote,
} from "@/services/whatsapp/types";
import { sanitizeWhatsappBody } from "@/services/whatsapp/messageMedia";
import type {
  SupportConversation,
  SupportDetails,
  SupportMessage,
  SupportNote,
  SupportTicket,
} from "./supportDummyData";

const AVATAR_COLORS = [
  "#DBEAFE",
  "#DCFCE7",
  "#FCE7F3",
  "#E0E7FF",
  "#FEF3C7",
  "#F3E8FF",
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function colorFor(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash += key.charCodeAt(i);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]!;
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function metaRecord(metadata: unknown): Record<string, unknown> {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>;
  }
  return {};
}

function parseTickets(metadata: unknown): SupportTicket[] {
  const raw = metaRecord(metadata).tickets;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const t = item as Record<string, unknown>;
      if (typeof t.id !== "string" || typeof t.title !== "string") return null;
      return {
        id: t.id,
        title: t.title,
        creator: typeof t.creator === "string" ? t.creator : "Front desk",
        status: typeof t.status === "string" ? t.status : "Open",
      };
    })
    .filter(Boolean) as SupportTicket[];
}

function parseMedia(media: unknown): SupportMessage["media"] {
  if (!Array.isArray(media)) return [];
  return media
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const m = item as Record<string, unknown>;
      if (typeof m.url !== "string") return null;
      return {
        url: m.url,
        mime: typeof m.mime === "string" ? m.mime : undefined,
        name: typeof m.name === "string" ? m.name : undefined,
        size: typeof m.size === "number" ? m.size : undefined,
        peaks: Array.isArray(m.peaks)
          ? m.peaks.filter((n): n is number => typeof n === "number")
          : undefined,
      };
    })
    .filter(Boolean) as NonNullable<SupportMessage["media"]>;
}

function parseFlow(flow: unknown): SupportMessage["flow"] {
  if (!flow || typeof flow !== "object" || Array.isArray(flow)) return null;
  const f = flow as Record<string, unknown>;
  const buttonsRaw = Array.isArray(f.buttons) ? f.buttons : [];
  const buttons = buttonsRaw
    .map((b) => {
      if (!b || typeof b !== "object") return null;
      const row = b as Record<string, unknown>;
      if (typeof row.id !== "string" || typeof row.title !== "string") {
        return null;
      }
      return { id: row.id, title: row.title };
    })
    .filter(Boolean) as { id: string; title: string }[];
  return {
    kind: typeof f.kind === "string" ? f.kind : undefined,
    title: typeof f.title === "string" ? f.title : undefined,
    subtitle: typeof f.subtitle === "string" ? f.subtitle : undefined,
    cta: typeof f.cta === "string" ? f.cta : undefined,
    fields: Array.isArray(f.fields)
      ? f.fields.filter((x): x is string => typeof x === "string")
      : undefined,
    buttons: buttons.length ? buttons : undefined,
    ctaUrl: typeof f.ctaUrl === "string" ? f.ctaUrl : undefined,
    ctaLabel: typeof f.ctaLabel === "string" ? f.ctaLabel : undefined,
    latitude: typeof f.latitude === "number" ? f.latitude : undefined,
    longitude: typeof f.longitude === "number" ? f.longitude : undefined,
    address: typeof f.address === "string" ? f.address : undefined,
    phone: typeof f.phone === "string" ? f.phone : undefined,
  };
}

function parseStatusTimestamps(
  value: unknown,
): SupportMessage["statusTimestamps"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const v = value as Record<string, unknown>;
  return {
    sent_at: typeof v.sent_at === "string" ? v.sent_at : undefined,
    delivered_at: typeof v.delivered_at === "string" ? v.delivered_at : undefined,
    read_at: typeof v.read_at === "string" ? v.read_at : undefined,
    failed_at: typeof v.failed_at === "string" ? v.failed_at : undefined,
  };
}

function resolvePatientGroup(
  c: WhatsappConversation,
  patientGroups: PatientGroup[],
): PatientGroup | null {
  if (c.patient_key) {
    const byKey = getPatientGroup(patientGroups, c.patient_key);
    if (byKey) return byKey;
  }
  return findPatientGroupByPhone(patientGroups, c.phone_number);
}

function visitsAsTickets(group: PatientGroup): SupportTicket[] {
  return group.visits
    .slice()
    .reverse()
    .slice(0, 8)
    .map((visit) => ({
      id: visit.id,
      title: visit.service_label,
      creator: formatPatientVisitDate(visit.starts_at),
      status: visit.status.replace(/_/g, " "),
    }));
}

function detailsFromPatient(
  c: WhatsappConversation,
  group: PatientGroup | null,
  notes: SupportNote[],
): SupportDetails {
  const metaTickets = parseTickets(c.metadata);
  if (!group) {
    return {
      attributes: [
        { label: "Channel", value: "WhatsApp" },
        { label: "Status", value: c.status },
        { label: "Clinic record", value: "No matching patient" },
      ],
      clientData: [
        { label: "Name", value: c.contact_name ?? "—" },
        { label: "Phone", value: c.phone_number },
        { label: "Patient key", value: c.patient_key ?? "—" },
      ],
      tickets: metaTickets,
      notes,
    };
  }

  const stats = buildPatientHistoryStats(group);
  const detail = buildPatientHistoryDetail(group);
  const next = stats.nextVisit;

  return {
    attributes: [
      { label: "Channel", value: "WhatsApp" },
      { label: "Clinic record", value: "Matched by phone" },
      { label: "Visits", value: String(stats.visitCount) },
      {
        label: "Next visit",
        value: next
          ? `${formatPatientVisitDate(next.starts_at)} · ${next.status}`
          : "None",
      },
    ],
    clientData: [
      { label: "Name", value: group.displayName },
      { label: "Phone", value: group.phone || c.phone_number },
      { label: "Email", value: group.email || "—" },
      {
        label: "Services",
        value: detail.services.map((s) => s.label).slice(0, 3).join(", ") || "—",
      },
      {
        label: "Last visit",
        value: stats.lastVisit
          ? formatPatientVisitDate(stats.lastVisit.starts_at)
          : "—",
      },
      { label: "Patient key", value: group.patientKey },
      { label: "WhatsApp name", value: c.contact_name ?? "—" },
    ],
    tickets: [...visitsAsTickets(group), ...metaTickets],
    notes,
  };
}

export function mapWhatsappMessage(
  m: WhatsappMessage,
  contactName: string,
  agentName = "Front desk",
): SupportMessage {
  return {
    id: m.id,
    author: m.direction === "inbound" ? "customer" : "agent",
    authorName:
      m.direction === "inbound" ? contactName : agentName,
    body: sanitizeWhatsappBody(m.body, m.message_type),
    time: formatTime(m.wa_timestamp),
    waTimestamp: m.wa_timestamp,
    read: m.status === "read" || m.status === "delivered",
    status: m.status,
    statusTimestamps: parseStatusTimestamps(m.status_timestamps),
    messageType: m.message_type,
    media: parseMedia(m.media),
    flow: parseFlow(m.flow),
    kapsoWamid: m.kapso_wamid,
    replyTo: enrichReplyTo(parseReplyTo(m.reply_to), contactName, m, agentName),
  };
}

function enrichReplyTo(
  reply: SupportMessage["replyTo"],
  contactName: string,
  m: WhatsappMessage,
  agentName = "Front desk",
): SupportMessage["replyTo"] {
  if (!reply) {
    // Fallback for rows ingested before reply_to backfill
    const raw =
      m.raw && typeof m.raw === "object" && !Array.isArray(m.raw)
        ? (m.raw as Record<string, unknown>)
        : null;
    const context =
      raw?.context && typeof raw.context === "object" && !Array.isArray(raw.context)
        ? (raw.context as Record<string, unknown>)
        : null;
    const wamid = typeof context?.id === "string" ? context.id : null;
    if (!wamid) return null;
    return {
      wamid,
      authorName: agentName,
      body: "Original message",
      messageType: "text",
    };
  }
  if (reply.authorName === "Patient" && contactName.trim()) {
    return { ...reply, authorName: contactName };
  }
  if (reply.authorName === "Front desk" && agentName !== "Front desk") {
    return { ...reply, authorName: agentName };
  }
  return reply;
}

function parseReplyTo(value: unknown): SupportMessage["replyTo"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (typeof v.wamid !== "string") return null;
  return {
    wamid: v.wamid,
    authorName:
      typeof v.authorName === "string" ? v.authorName : "Patient",
    body: typeof v.body === "string" ? v.body : "",
    messageType:
      typeof v.messageType === "string" ? v.messageType : undefined,
  };
}

export function mapWhatsappToSupportUi(
  conversations: WhatsappConversation[],
  messagesByConversation: Record<string, WhatsappMessage[]>,
  notesByConversation: Record<string, WhatsappNote[]> = {},
  patientGroups: PatientGroup[] = [],
  agentName = "Front desk",
) {
  const uiConversations: SupportConversation[] = conversations.map((c) => {
    const patient = resolvePatientGroup(c, patientGroups);
    const name =
      patient?.displayName || c.contact_name?.trim() || c.phone_number;
    const patientKey = patient?.patientKey ?? c.patient_key ?? undefined;
    return {
      id: c.id,
      name,
      initials: initials(name),
      avatarColor: colorFor(c.id),
      preview: (() => {
        const cleaned = sanitizeWhatsappBody(
          c.last_message_preview || "",
          c.last_message_type || "text",
        );
        if (cleaned) return cleaned;
        const type = (c.last_message_type || "").toLowerCase();
        if (type === "image" || type === "sticker") return "Photo";
        if (type === "audio" || type === "voice") return "Voice message";
        if (type === "video") return "Video";
        if (type === "document") return "Document";
        if (type === "flow" || type === "interactive") return "Form";
        if (type === "unsupported" || type === "unknown") {
          return "Unsupported message";
        }
        const raw = (c.last_message_preview || "").toLowerCase();
        if (
          raw.includes("unsupported") ||
          raw.includes("131051") ||
          raw.includes("message type unknown")
        ) {
          return "Unsupported message";
        }
        return c.last_message_preview || "No messages yet";
      })(),
      lastMessageType: c.last_message_type || undefined,
      lastMessageAt: c.last_message_at ?? undefined,
      lastMessageStatus: (c.last_message_status as SupportMessage["status"]) || undefined,
      timestamp: formatTime(c.last_message_at),
      status: c.status,
      tags: [
        { label: "WhatsApp" },
        ...(patient || c.patient_key ? [{ label: "Patient" }] : []),
        ...(c.status === "ended"
          ? [{ label: "Ended", tone: "danger" as const }]
          : []),
        ...(c.status === "archived"
          ? [{ label: "Archived" }]
          : []),
        ...(metaRecord(c.metadata).is_demo ? [{ label: "Demo" }] : []),
      ],
      unread: c.unread_count > 0 ? String(c.unread_count) : undefined,
      whatsapp: true,
      phone: patient?.phone || c.phone_number,
      patientKey,
      workspaceHref: patientKey
        ? patientWorkspacePath(patientKey)
        : undefined,
      profileHref: patientKey ? patientProfilePath(patientKey) : undefined,
    };
  });

  const detailsById: Record<string, SupportDetails> = {};
  const messagesById: Record<string, SupportMessage[]> = {};

  for (const c of conversations) {
    const patient = resolvePatientGroup(c, patientGroups);
    const contactName =
      patient?.displayName || c.contact_name?.trim() || c.phone_number;
    const notes: SupportNote[] = (notesByConversation[c.id] ?? []).map((n) => ({
      id: n.id,
      author: n.author,
      body: n.body,
      pinned: n.pinned,
      createdAt: n.created_at,
      updatedAt: n.updated_at,
    }));

    detailsById[c.id] = detailsFromPatient(c, patient, notes);
    messagesById[c.id] = (messagesByConversation[c.id] ?? []).map((m) =>
      mapWhatsappMessage(m, contactName, agentName),
    );
  }

  const openCount = conversations.filter((c) => c.status === "active").length;

  return {
    uiConversations,
    detailsById,
    messagesById,
    openCount,
  };
}
