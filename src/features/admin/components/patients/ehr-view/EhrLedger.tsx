"use client";

import type { PatientToothNote } from "@/services/patient_tooth_notes";
import type { TreatmentItem } from "@/services/patient_treatments";
import type { EhrCondition } from "./ehr.types";
import { EHR } from "./ehr.types";
import { plainText } from "./ehrScene";
import { EhrClusterLabel, EhrConditionPill, EhrNoteNode } from "./EhrNodes";

type Props = {
  conditions: EhrCondition[];
  treatments: TreatmentItem[];
  activeId: string | null;
  notes: PatientToothNote[];
  emptyNotes: string;
  onSelect: (condition: EhrCondition) => void;
};

export function EhrLedger({
  conditions,
  treatments,
  activeId,
  notes,
  emptyNotes,
  onSelect,
}: Props) {
  return (
    <div className="flex min-w-0 flex-col gap-8">
      <section>
        <EhrClusterLabel
          label="Required treatments"
          count={conditions.length}
        />
        <Spine>
          {conditions.length === 0 ? (
            <EmptyCard text="No required treatments yet." />
          ) : (
            conditions.map((c) => {
              const tx = treatments.find((t) => t.id === c.id);
              return (
                <EhrConditionPill
                  key={c.id}
                  toothName={c.toothName}
                  fdi={c.fdi}
                  active={c.id === activeId}
                  metric={tx?.status}
                  onClick={() => onSelect(c)}
                />
              );
            })
          )}
        </Spine>
      </section>
      <section>
        <EhrClusterLabel label="Notes" count={notes.length} />
        <div className="flex flex-col gap-2">
          {notes.length === 0 ? (
            <EmptyCard text={emptyNotes} />
          ) : (
            notes.map((note) => (
              <EhrNoteNode
                key={note.id}
                title={`Tooth #${note.fdi_number}`}
                preview={plainText(note.body)}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function Spine({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <span
        aria-hidden
        className="absolute top-4 bottom-4 left-[26px] w-px"
        style={{ background: EHR.border }}
      />
      <div className="relative flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div
      className="rounded-2xl border px-4 py-3 text-[12px]"
      style={{ background: EHR.card, borderColor: EHR.border, color: EHR.muted }}
    >
      {text}
    </div>
  );
}
