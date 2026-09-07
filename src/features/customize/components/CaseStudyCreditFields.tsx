"use client";

import { CASE_STUDY_FIELD_LABELS } from "../lib/caseStudyFields";
import { ControlledField } from "./ControlledField";
import { EditorFieldShell } from "./EditorFieldShell";

type Props = {
  item: Record<string, unknown>;
  onPatch: (partial: Record<string, unknown>) => void;
};

export function CaseStudyCreditFields({ item, onPatch }: Props) {
  return (
    <>
      <EditorFieldShell field="client">
        <ControlledField
          label={CASE_STUDY_FIELD_LABELS.client}
          value={String(item.client ?? "")}
          onChange={(client) => onPatch({ client: client || null })}
        />
      </EditorFieldShell>
      <EditorFieldShell field="director">
        <ControlledField
          label={CASE_STUDY_FIELD_LABELS.director}
          value={String(item.director ?? "")}
          onChange={(director) => onPatch({ director: director || null })}
        />
      </EditorFieldShell>
      <EditorFieldShell field="agency">
        <ControlledField
          label={CASE_STUDY_FIELD_LABELS.agency}
          value={String(item.agency ?? "")}
          onChange={(agency) => onPatch({ agency: agency || null })}
        />
      </EditorFieldShell>
      <EditorFieldShell field="production_company">
        <ControlledField
          label={CASE_STUDY_FIELD_LABELS.production_company}
          value={String(item.production_company ?? "")}
          onChange={(production_company) =>
            onPatch({ production_company: production_company || null })
          }
        />
      </EditorFieldShell>
    </>
  );
}
