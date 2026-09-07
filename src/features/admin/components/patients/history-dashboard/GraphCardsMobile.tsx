"use client";

import { CbctVisitCard } from "./CbctVisitCard";
import { EndoNoteStack } from "./EndoNoteStack";
import { VitalityVisitCard } from "./VitalityVisitCard";
import { WhitePillCard } from "./WhitePillCard";

export function GraphCardsMobile() {
  const noop = () => undefined;
  const noopRef = () => () => undefined;
  return (
    <div className="mt-4 flex flex-col gap-3 lg:hidden">
      <VitalityVisitCard />
      <WhitePillCard
        anchor="perio"
        title="Office Visit: Perio Probing Depth"
        date="07.10"
        onHover={noop}
      />
      <WhitePillCard
        anchor="culture"
        title="Office Visit: Canal Culture"
        date="07.10"
        onHover={noop}
      />
      <WhitePillCard
        anchor="bone"
        title="Office Visit: Bone Loss Test"
        date="07.10"
        onHover={noop}
      />
      <CbctVisitCard onOpen={noop} onHover={noop} />
      <WhitePillCard
        anchor="biopsy"
        title="Office Visit: Biopsy Results"
        date="07.10"
        onHover={noop}
      />
      <EndoNoteStack registerRef={noopRef} onHover={noop} />
      <WhitePillCard
        anchor="tmj"
        title="Office Visit: TMJ / Mandibular Scan"
        date="07.10"
        onHover={noop}
      />
      <WhitePillCard
        anchor="occlusion"
        title="Office Visit: Occlusion Alignment"
        date="07.10"
        onHover={noop}
      />
    </div>
  );
}
