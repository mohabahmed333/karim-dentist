import {
  buildPatientHistoryDetail,
  buildPatientHistoryStats,
  formatPatientVisitDate,
  patientProfilePath,
  patientWorkspacePath,
  type PatientGroup,
} from "@/services/reservations/patientHistory";
import type {
  SupportConversation,
  SupportDetails,
  SupportMessage,
  SupportTagTone,
} from "./supportDummyData";

const AVATAR_COLORS = [
  "#DBEAFE",
  "#DCFCE7",
  "#FCE7F3",
  "#E0E7FF",
  "#FEF3C7",
  "#F3E8FF",
  "#CCFBF1",
  "#FFEDD5",
];

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function colorForKey(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash + key.charCodeAt(i) * (i + 1)) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[hash] ?? AVATAR_COLORS[0]!;
}

function formatRelativeTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startThat = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const dayDiff = Math.round(
    (startToday.getTime() - startThat.getTime()) / 86_400_000,
  );
  if (dayDiff === 0) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  if (dayDiff === 1) return "Yesterday";
  if (dayDiff > 1 && dayDiff < 7) {
    return date.toLocaleDateString("en-US", { weekday: "long" });
  }
  return date.toLocaleDateString("en-GB");
}

function statusTag(
  status: string,
): { label: string; tone?: SupportTagTone } | null {
  if (status === "pending") return { label: "Pending", tone: "danger" };
  if (status === "confirmed") return { label: "Confirmed" };
  if (status === "completed") return { label: "Completed" };
  if (status === "no_show") return { label: "No-show", tone: "danger" };
  if (status === "cancelled") return { label: "Cancelled", tone: "danger" };
  return null;
}

export type ClinicSupportBundle = {
  conversations: SupportConversation[];
  detailsById: Record<string, SupportDetails>;
  messagesById: Record<string, SupportMessage[]>;
  openCount: number;
};

export function mapPatientsToClinicSupport(
  groups: PatientGroup[],
): ClinicSupportBundle {
  const conversations: SupportConversation[] = [];
  const detailsById: Record<string, SupportDetails> = {};
  const messagesById: Record<string, SupportMessage[]> = {};
  let openCount = 0;

  const sorted = [...groups].sort((a, b) => {
    const aLatest = a.visits[a.visits.length - 1]?.starts_at ?? "";
    const bLatest = b.visits[b.visits.length - 1]?.starts_at ?? "";
    return bLatest.localeCompare(aLatest);
  });

  for (const group of sorted) {
    const stats = buildPatientHistoryStats(group);
    const detail = buildPatientHistoryDetail(group);
    const latest = group.visits[group.visits.length - 1];
    const next = stats.nextVisit;
    const focus = next ?? latest;
    if (!focus) continue;

    if (stats.hasUpcoming || focus.status === "pending") openCount += 1;

    const tags: SupportConversation["tags"] = [];
    if (stats.isReturning) tags.push({ label: "Returning" });
    else tags.push({ label: "New" });
    if (stats.hasUpcoming) tags.push({ label: "Upcoming" });
    const st = statusTag(focus.status);
    if (st) tags.push(st);

    const preview = next
      ? `Next: ${next.service_label} · ${formatPatientVisitDate(next.starts_at)}`
      : `Last: ${focus.service_label} · ${focus.status}`;

    conversations.push({
      id: group.patientKey,
      name: group.displayName,
      initials: initialsFromName(group.displayName),
      avatarColor: colorForKey(group.patientKey),
      preview,
      timestamp: formatRelativeTimestamp(focus.starts_at),
      tags,
      starred: stats.isReturning,
      whatsapp: Boolean(group.phone),
      workspaceHref: patientWorkspacePath(group.patientKey),
      profileHref: patientProfilePath(group.patientKey),
    });

    detailsById[group.patientKey] = {
      attributes: [
        { label: "Patient key", value: group.patientKey },
        { label: "Channel", value: group.phone ? "Phone / WhatsApp" : "Walk-in" },
        {
          label: "Visits",
          value: String(stats.visitCount),
        },
        {
          label: "Next visit",
          value: next
            ? `${formatPatientVisitDate(next.starts_at)} · ${next.status}`
            : "None",
        },
      ],
      clientData: [
        { label: "Name", value: group.displayName },
        { label: "Phone", value: group.phone || "—" },
        { label: "Email", value: group.email || "—" },
        {
          label: "Services",
          value:
            detail.services.map((s) => s.label).slice(0, 3).join(", ") || "—",
        },
        {
          label: "Last visit",
          value: stats.lastVisit
            ? formatPatientVisitDate(stats.lastVisit.starts_at)
            : "—",
        },
      ],
      tickets: group.visits
        .slice()
        .reverse()
        .slice(0, 5)
        .map((visit) => ({
          id: visit.id,
          title: visit.service_label,
          creator: formatPatientVisitDate(visit.starts_at),
          status: visit.status.replace("_", " "),
        })),
      notes: [
        {
          id: `n-${group.patientKey}`,
          author: "Front desk",
          body: next
            ? `Upcoming ${next.service_label} — confirm attendance`
            : "No upcoming visit on file",
        },
      ],
    };

    messagesById[group.patientKey] = [
      {
        id: `seed-${group.patientKey}-1`,
        author: "customer",
        authorName: group.displayName,
        body: next
          ? `Hi — I have an appointment for ${next.service_label} on ${formatPatientVisitDate(next.starts_at)}. Can you confirm?`
          : `Hi — I wanted to check on my visits at The Dental Lounge.`,
        time: "09:00",
      },
      {
        id: `seed-${group.patientKey}-2`,
        author: "agent",
        authorName: "Front desk",
        body: next
          ? `Hello ${group.displayName.split(" ")[0] ?? ""} — you're booked for ${next.service_label}. Reply here or open the clinical workspace if you need charting.`
          : `Hello ${group.displayName.split(" ")[0] ?? ""} — we can help book your next visit from Reservations or Clinic Assist.`,
        time: "09:05",
        read: true,
      },
    ];
  }

  return { conversations, detailsById, messagesById, openCount };
}
