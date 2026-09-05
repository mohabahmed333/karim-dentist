export type SidebarView = "AIAssist" | "CaseDetails" | "Queue";

export type NumberingSystem = "FDI" | "Universal" | "Palmer";
export type DentitionMode = "Adult" | "Child";
export type ChartingTool =
  | "Select"
  | "Decay"
  | "Filling"
  | "Crown"
  | "Missing"
  | "Clear";

export const SIDEBAR_VIEWS: { id: SidebarView; label: string }[] = [
  { id: "AIAssist", label: "AI Assist" },
  { id: "CaseDetails", label: "Case" },
  { id: "Queue", label: "Queue" },
];

export const NUMBERING_OPTIONS: NumberingSystem[] = [
  "FDI",
  "Universal",
  "Palmer",
];

export const DENTITION_OPTIONS: DentitionMode[] = ["Adult", "Child"];

export const CHARTING_TOOLS: ChartingTool[] = [
  "Select",
  "Decay",
  "Filling",
  "Crown",
  "Missing",
  "Clear",
];

export type DiagnosticStats = {
  coldResponse: string;
  eptScore: string;
  percussion: string;
  mobility: string;
  note: string;
};

export const EMPTY_DIAGNOSTIC: DiagnosticStats = {
  coldResponse: "",
  eptScore: "",
  percussion: "",
  mobility: "",
  note: "",
};
