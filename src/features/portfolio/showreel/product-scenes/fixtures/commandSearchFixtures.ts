export type CommandSearchHit = {
  id: string;
  kind: "patient" | "reservation" | "thread" | "page";
  title: string;
  subtitle: string;
  href?: string;
};

export const COMMAND_SEARCH_FIXTURE = {
  query: "reservations page",
  aiUsed: true,
  hits: [
    {
      id: "hit-page",
      kind: "page" as const,
      title: "Reservations",
      subtitle: "Admin · calendar",
      href: "/admin/reservations",
    },
    {
      id: "hit-sara",
      kind: "patient" as const,
      title: "Sara Hassan",
      subtitle: "VIP · whitening pending",
      href: "/admin/patients",
    },
    {
      id: "hit-res",
      kind: "reservation" as const,
      title: "Teeth whitening · Tue 10:30",
      subtitle: "Sara Hassan · pending",
      href: "/admin/reservations",
    },
    {
      id: "hit-chat",
      kind: "thread" as const,
      title: "WhatsApp · Sara Hassan",
      subtitle: "Can I book teeth whitening this week?",
      href: "/admin/support",
    },
  ] satisfies CommandSearchHit[],
};

export const CHAT_LAYOUT_SCRIPT = [
  "float",
  "dock",
  "collapse",
] as const;
