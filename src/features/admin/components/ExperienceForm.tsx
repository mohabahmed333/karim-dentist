"use client";

import { FormEvent } from "react";
import type { ExperienceEntry } from "@/services/experience_entries";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  item: ExperienceEntry;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  pending: boolean;
  message: string | null;
};

export function ExperienceForm({ item, onSubmit, pending, message }: Props) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onSubmit({
      title: String(form.get("title") ?? ""),
      org: String(form.get("org") ?? "") || null,
      date_label: String(form.get("date_label") ?? "") || null,
      description: String(form.get("description") ?? "") || null,
    });
  }

  return (
    <form
      id="experience-form"
      className="space-y-4"
      onSubmit={(e) => void handleSubmit(e)}
    >
      {(["title", "org", "date_label"] as const).map((name) => (
        <div key={name} className="space-y-2">
          <Label htmlFor={name}>{name}</Label>
          <Input
            id={name}
            name={name}
            defaultValue={item[name] ?? ""}
            key={item.id + name}
          />
        </div>
      ))}
      <div className="space-y-2">
        <Label htmlFor="description">description</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={item.description ?? ""}
          key={item.id + "description"}
        />
      </div>
      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}
      {pending ? (
        <p className="text-sm text-muted-foreground">Saving…</p>
      ) : null}
    </form>
  );
}
