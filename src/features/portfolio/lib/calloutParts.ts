export type CalloutParts = {
  lead: string;
  accent: string;
};

const SEPARATOR = "…";

export function splitCalloutBody(body: string): CalloutParts {
  const parts = body.split(/\s*[…]\s*|\s*\.\.\.\s*/);
  if (parts.length >= 2) {
    return {
      lead: parts[0]?.trim() ?? "",
      accent: parts.slice(1).join(" ").trim(),
    };
  }
  return { lead: body.trim(), accent: "" };
}

export function joinCalloutBody(lead: string, accent: string): string {
  const cleanLead = lead.trim();
  const cleanAccent = accent.trim();
  if (!cleanAccent) return cleanLead;
  if (!cleanLead) return `${SEPARATOR}${cleanAccent}`;
  return `${cleanLead}${SEPARATOR}${cleanAccent}`;
}

export function calloutScriptLines(lead: string): string[] {
  const trimmed = lead.trim();
  if (!trimmed) return [""];

  if (trimmed.includes("\n")) {
    return trimmed
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  const words = trimmed.replace(/[^\w\s]/g, " ").split(/\s+/).filter(Boolean);
  const joined = words.join(" ").toUpperCase();
  if (joined.includes("TALES") && joined.includes("HOLD")) {
    return ["The Tales", "We Hold Within"];
  }
  if (words.length <= 2) return [words.join(" ") || trimmed];
  const mid = Math.ceil(words.length / 2);
  return [
    titleCase(words.slice(0, mid).join(" ")),
    titleCase(words.slice(mid).join(" ")),
  ];
}

export function calloutAccentLabel(accent: string): string {
  const clean = accent
    .replace(/^\.+/, "")
    .replace(/\.$/, "")
    .trim()
    .toUpperCase();
  return clean ? `..${clean}` : "";
}

function titleCase(value: string) {
  return value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}
