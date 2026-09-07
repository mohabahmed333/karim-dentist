import type { EhrMediaPanel } from "./ehr.types";

export type EhrEdge = {
  id: string;
  from: string;
  to: string;
  kind: "fan" | "thin";
};

export type EhrSceneInput = {
  conditionIds: string[];
  activeConditionId: string | null;
  noteIds: string[];
  propIds: string[];
  mediaIds: string[];
  visitId: string | null;
  expanded: boolean;
};

/** Clinical workspace is a document, not a node graph. */
export function buildEhrSceneEdges(_input: EhrSceneInput): EhrEdge[] {
  return [];
}

export function plainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function linkedMediaFor(
  treatment: {
    attachments: { id: string; kind: string; file_url: string }[];
  } | null,
  visitId: string | undefined,
  fallback: EhrMediaPanel[],
): EhrMediaPanel[] {
  const fromTx =
    treatment?.attachments.filter(
      (a) => a.kind === "xray" || a.kind === "image",
    ) ?? [];
  if (fromTx.length > 0) {
    return fromTx.slice(0, 4).map((a, i) => ({
      id: a.id,
      visitId: visitId ?? "v0",
      label: a.kind === "xray" ? `X-ray · ${i + 1}` : `Image · ${i + 1}`,
      dateLabel: "",
      index: i + 1,
      variant: "light",
      urls: [a.file_url],
    }));
  }
  if (visitId) {
    const byVisit = fallback.filter((m) => m.visitId === visitId);
    if (byVisit.length > 0) return byVisit;
  }
  return fallback.slice(0, 2);
}
