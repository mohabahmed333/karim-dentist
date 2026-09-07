"use client";

import { ControlledField } from "./ControlledField";

type Props = {
  item: Record<string, unknown> & { id: string };
  onPatch: (partial: Record<string, unknown>) => void;
};

export function ExperienceItemFields({ item, onPatch }: Props) {
  return (
    <>
      <ControlledField
        label="Title"
        value={String(item.title ?? "")}
        onChange={(title) => onPatch({ title })}
      />
      <ControlledField
        label="Org"
        value={String(item.org ?? "")}
        onChange={(org) => onPatch({ org })}
      />
      <ControlledField
        label="Date"
        value={String(item.date_label ?? "")}
        onChange={(date_label) => onPatch({ date_label })}
      />
      <ControlledField
        label="Description"
        value={String(item.description ?? "")}
        onChange={(description) => onPatch({ description })}
        multiline
      />
    </>
  );
}
