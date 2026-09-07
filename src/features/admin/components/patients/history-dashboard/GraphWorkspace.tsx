"use client";

import { CbctVisitCard } from "./CbctVisitCard";
import { EndoNoteStack } from "./EndoNoteStack";
import { HxMotionReveal } from "./HxMotionReveal";
import { VitalityVisitCard } from "./VitalityVisitCard";
import { WhitePillCard } from "./WhitePillCard";
import { CARD_ANCHOR_MAP, type GraphCardId } from "@/services/dental_chart/graph-network";
import type { GraphAnchor } from "@/services/dental_chart";
import type { HoveredEntity } from "./dashboard-interaction.types";
import type { RegisterNodeRef } from "./useNodeRefMap";

type Props = {
  visibleAnchors: GraphAnchor[];
  expanded: boolean;
  hoveredEntity: HoveredEntity;
  registerRef: RegisterNodeRef;
  onOpenCbct: () => void;
  onHoverCard: (id: string | null) => void;
};

function showCard(id: GraphCardId, visible: GraphAnchor[], expanded: boolean) {
  return expanded && visible.includes(CARD_ANCHOR_MAP[id]);
}

export function GraphWorkspace({
  visibleAnchors,
  expanded,
  hoveredEntity,
  registerRef,
  onOpenCbct,
  onHoverCard,
}: Props) {
  const show = (id: GraphCardId) => showCard(id, visibleAnchors, expanded);
  const hot = (anchor: GraphAnchor) =>
    hoveredEntity?.type === "CARD" && hoveredEntity.id === anchor;

  return (
    <div className="relative hidden min-h-[560px] lg:grid lg:grid-cols-3 lg:gap-5 lg:px-1">
      <div className="flex flex-col gap-3 pt-1">
        <HxMotionReveal visible={show("card-pulpectomy")}>
          <div ref={registerRef("card-pulpectomy")} className="w-full">
            <VitalityVisitCard hot={hot("vitality")} />
          </div>
        </HxMotionReveal>
        <HxMotionReveal visible={show("card-perio")}>
          <div ref={registerRef("card-perio")} className="w-full">
            <WhitePillCard
              anchor="perio"
              title="Office Visit: Perio Probing Depth"
              date="07.10"
              hot={hot("perio")}
              onHover={onHoverCard}
            />
          </div>
        </HxMotionReveal>
        <HxMotionReveal visible={show("card-culture")}>
          <div ref={registerRef("card-culture")} className="w-full">
            <WhitePillCard
              anchor="culture"
              title="Office Visit: Canal Culture"
              date="07.10"
              hot={hot("culture")}
              onHover={onHoverCard}
            />
          </div>
        </HxMotionReveal>
      </div>

      <div className="flex flex-col justify-between gap-3 py-1">
        <HxMotionReveal visible={show("card-bone")}>
          <div ref={registerRef("card-bone")} className="w-full">
            <WhitePillCard
              anchor="bone"
              title="Office Visit: Bone Loss Test"
              date="07.10"
              hot={hot("bone")}
              onHover={onHoverCard}
            />
          </div>
        </HxMotionReveal>
        <HxMotionReveal visible={show("card-cbct")} className="flex flex-1 items-center">
          <div ref={registerRef("card-cbct")} className="w-full">
            <CbctVisitCard onOpen={onOpenCbct} hot={hot("cbct")} onHover={onHoverCard} />
          </div>
        </HxMotionReveal>
        <HxMotionReveal visible={show("card-biopsy")}>
          <div ref={registerRef("card-biopsy")} className="w-full">
            <WhitePillCard
              anchor="biopsy"
              title="Office Visit: Biopsy Results"
              date="07.10"
              hot={hot("biopsy")}
              onHover={onHoverCard}
            />
          </div>
        </HxMotionReveal>
      </div>

      <div className="flex flex-col gap-3 pt-1">
        <HxMotionReveal visible={show("card-endo-note")}>
          <EndoNoteStack
            hot={hot("note")}
            registerRef={registerRef}
            onHover={onHoverCard}
          />
        </HxMotionReveal>
        <HxMotionReveal visible={show("card-tmj")}>
          <div ref={registerRef("card-tmj")} className="w-full">
            <WhitePillCard
              anchor="tmj"
              title="Office Visit: TMJ / Mandibular Scan"
              date="07.10"
              hot={hot("tmj")}
              onHover={onHoverCard}
            />
          </div>
        </HxMotionReveal>
        <HxMotionReveal visible={show("card-occlusion")}>
          <div ref={registerRef("card-occlusion")} className="w-full">
            <WhitePillCard
              anchor="occlusion"
              title="Office Visit: Occlusion Alignment"
              date="07.10"
              hot={hot("occlusion")}
              onHover={onHoverCard}
            />
          </div>
        </HxMotionReveal>
      </div>
    </div>
  );
}
