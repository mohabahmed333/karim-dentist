import type { DashboardTab } from "./dashboard.types";

export const DASHBOARD_TABS: { id: DashboardTab; label: string }[] = [
  { id: "history", label: "History" },
  { id: "clinical", label: "Clinical" },
  { id: "teeth", label: "Teeth" },
  { id: "charting", label: "Charting" },
];

/** DISABLED: assigned-team stack until real assign CRUD exists */
export const TEAM = [
  { name: "Dr. Karim Elshibiny", src: "/design/about-portrait.png" },
  { name: "Nour Hassan", initials: "NH" },
  { name: "Yara Mostafa", initials: "YM" },
  { name: "Omar Saleh", initials: "OS" },
] as const;
