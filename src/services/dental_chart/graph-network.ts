import type { ConditionType, GraphAnchor } from "./enums";
import { CONDITION_LABELS } from "./labels";

export const SOURCE_NODE_ID = "source";

export type GraphCardId =
  | "card-pulpectomy"
  | "card-perio"
  | "card-culture"
  | "card-bone"
  | "card-cbct"
  | "card-biopsy"
  | "card-endo-note"
  | "card-hospital"
  | "card-tmj"
  | "card-occlusion";

export type GraphCardNode = {
  id: GraphCardId;
  title: string;
  anchor: GraphAnchor;
  column: 1 | 2 | 3;
  children: GraphCardId[];
};

export type GraphSourceNode = {
  id: typeof SOURCE_NODE_ID;
  title: string;
  type: "SOURCE_CONDITION";
  children: GraphCardId[];
};

export type GraphNetworkEdge = {
  id: string;
  from: string;
  to: string;
  sourceAnchor: GraphAnchor | null;
  targetAnchor: GraphAnchor;
};

export type GraphNetwork = {
  source: GraphSourceNode;
  cards: GraphCardNode[];
  edges: GraphNetworkEdge[];
};

const CARD_META: Record<
  GraphCardId,
  { anchor: GraphAnchor; column: 1 | 2 | 3; label: (tooth: number) => string }
> = {
  "card-pulpectomy": {
    anchor: "vitality",
    column: 1,
    label: (tooth) => `Tooth #${tooth} Pulpectomy`,
  },
  "card-perio": {
    anchor: "perio",
    column: 1,
    label: () => "Perio Probing Depth",
  },
  "card-culture": {
    anchor: "culture",
    column: 1,
    label: () => "Canal Culture",
  },
  "card-bone": {
    anchor: "bone",
    column: 2,
    label: () => "Bone Loss Test",
  },
  "card-cbct": {
    anchor: "cbct",
    column: 2,
    label: (tooth) => `Tooth #${tooth} CBCT Scan`,
  },
  "card-biopsy": {
    anchor: "biopsy",
    column: 2,
    label: () => "Biopsy Results",
  },
  "card-endo-note": {
    anchor: "note",
    column: 3,
    label: () => "Endodontic Note",
  },
  "card-hospital": {
    anchor: "hospital",
    column: 3,
    label: () => "Root Canal Hospitalization Note",
  },
  "card-tmj": {
    anchor: "tmj",
    column: 3,
    label: () => "TMJ / Mandibular Scan",
  },
  "card-occlusion": {
    anchor: "occlusion",
    column: 3,
    label: () => "Occlusion Alignment",
  },
};

export const CARD_ANCHOR_MAP = Object.fromEntries(
  Object.entries(CARD_META).map(([id, meta]) => [id, meta.anchor]),
) as Record<GraphCardId, GraphAnchor>;

export const ANCHOR_CARD_MAP = Object.fromEntries(
  Object.entries(CARD_META).map(([id, meta]) => [meta.anchor, id]),
) as Partial<Record<GraphAnchor, GraphCardId>>;

type TreeDef = {
  sourceChildren: GraphCardId[];
  cardChildren: Partial<Record<GraphCardId, GraphCardId[]>>;
};

const CONDITION_GRAPHS: Record<ConditionType, TreeDef> = {
  ENDODONTIC_INFECTION: {
    sourceChildren: ["card-pulpectomy", "card-perio", "card-culture"],
    cardChildren: {
      "card-pulpectomy": ["card-bone", "card-cbct"],
      "card-perio": ["card-bone"],
      "card-culture": ["card-biopsy"],
      "card-cbct": ["card-endo-note", "card-hospital"],
      "card-bone": ["card-tmj"],
      "card-biopsy": ["card-occlusion"],
    },
  },
  PULPITIS: {
    sourceChildren: ["card-pulpectomy", "card-culture"],
    cardChildren: { "card-pulpectomy": ["card-cbct"] },
  },
  GINGIVAL_RECESSION: {
    sourceChildren: ["card-perio"],
    cardChildren: {},
  },
  PERIODONTITIS: {
    sourceChildren: ["card-perio", "card-culture"],
    cardChildren: { "card-perio": ["card-bone", "card-biopsy"] },
  },
  PERIAPICAL_ABSCESS: {
    sourceChildren: ["card-cbct", "card-biopsy"],
    cardChildren: { "card-cbct": ["card-hospital"] },
  },
  TOOTH_FRACTURE: {
    sourceChildren: ["card-endo-note", "card-tmj"],
    cardChildren: { "card-tmj": ["card-occlusion"] },
  },
  IMPLANT_DEGRADATION: {
    sourceChildren: ["card-cbct", "card-bone"],
    cardChildren: { "card-cbct": ["card-endo-note"] },
  },
};

function buildCard(id: GraphCardId, tooth: number, children: GraphCardId[]): GraphCardNode {
  const meta = CARD_META[id];
  return { id, title: meta.label(tooth), anchor: meta.anchor, column: meta.column, children };
}

function flattenEdges(
  cards: Map<GraphCardId, GraphCardNode>,
  sourceChildren: GraphCardId[],
): GraphNetworkEdge[] {
  const edges: GraphNetworkEdge[] = [];
  const walk = (from: string, childIds: GraphCardId[]) => {
    for (const childId of childIds) {
      const card = cards.get(childId);
      if (!card) continue;
      const sourceAnchor =
        from === SOURCE_NODE_ID ? null : (cards.get(from as GraphCardId)?.anchor ?? null);
      edges.push({
        id: `${from}->${childId}`,
        from,
        to: childId,
        sourceAnchor,
        targetAnchor: card.anchor,
      });
      walk(childId, card.children);
    }
  };
  walk(SOURCE_NODE_ID, sourceChildren);
  return edges;
}

function pruneTree(def: TreeDef, visible: Set<GraphAnchor>): TreeDef {
  const keep = (id: GraphCardId) => visible.has(CARD_META[id].anchor);
  const sourceChildren = def.sourceChildren.filter(keep);
  const cardChildren: TreeDef["cardChildren"] = {};
  for (const [parent, kids] of Object.entries(def.cardChildren)) {
    if (!keep(parent as GraphCardId)) continue;
    const next = kids?.filter(keep) ?? [];
    if (next.length > 0) cardChildren[parent as GraphCardId] = next;
  }
  return { sourceChildren, cardChildren };
}

export function buildGraphNetwork(
  conditionType: ConditionType,
  toothNumber: number,
  visibleAnchors: GraphAnchor[],
): GraphNetwork {
  const visible = new Set(visibleAnchors);
  const def = pruneTree(CONDITION_GRAPHS[conditionType], visible);
  const cardMap = new Map<GraphCardId, GraphCardNode>();
  for (const id of def.sourceChildren) {
    cardMap.set(id, buildCard(id, toothNumber, def.cardChildren[id] ?? []));
  }
  for (const [parent, kids] of Object.entries(def.cardChildren)) {
    for (const id of kids ?? []) {
      if (cardMap.has(id)) continue;
      cardMap.set(id, buildCard(id, toothNumber, def.cardChildren[id] ?? []));
    }
    if (!cardMap.has(parent as GraphCardId) && visible.has(CARD_META[parent as GraphCardId].anchor)) {
      cardMap.set(
        parent as GraphCardId,
        buildCard(parent as GraphCardId, toothNumber, def.cardChildren[parent as GraphCardId] ?? []),
      );
    }
  }
  return {
    source: {
      id: SOURCE_NODE_ID,
      title: CONDITION_LABELS[conditionType],
      type: "SOURCE_CONDITION",
      children: def.sourceChildren,
    },
    cards: [...cardMap.values()],
    edges: flattenEdges(cardMap, def.sourceChildren),
  };
}
