"use client";

type Props = {
  field: string;
  children: React.ReactNode;
};

export function EditorFieldShell({ field, children }: Props) {
  return <div data-editor-field={field}>{children}</div>;
}
