"use client";

import { FormEvent } from "react";
import { useTranslations } from "@/lib/i18n";
import type { ClinicKnowledge } from "@/services/clinic_knowledge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  item: ClinicKnowledge;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  pending: boolean;
  message: string | null;
};

/** Comma-separated in the UI, text[] in the database. */
function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

export function KnowledgeForm({ item, onSubmit, pending, message }: Props) {
  const t = useTranslations();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onSubmit({
      title: String(form.get("title") ?? ""),
      title_ar: String(form.get("title_ar") ?? ""),
      body: String(form.get("body") ?? ""),
      body_ar: String(form.get("body_ar") ?? ""),
      tags: parseTags(String(form.get("tags") ?? "")),
      is_published: form.get("is_published") === "on",
    });
  }

  return (
    <form id="knowledge-form" className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
      <p className="text-xs text-muted-foreground">
        The assistant searches the title and body in both languages, and quotes
        what it finds. Write the answer you would want a receptionist to give —
        short, factual, and safe to send without checking.
      </p>
      <div className="space-y-2">
        <Label htmlFor="title">Title (EN)</Label>
        <Input id="title" name="title" defaultValue={item.title} key={item.id + "title"} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="title_ar">Title (AR)</Label>
        <Input
          id="title_ar"
          name="title_ar"
          defaultValue={item.title_ar ?? ""}
          key={item.id + "title_ar"}
          dir="rtl"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">Answer (EN)</Label>
        <Textarea id="body" name="body" rows={4} defaultValue={item.body} key={item.id + "body"} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="body_ar">Answer (AR)</Label>
        <Textarea
          id="body_ar"
          name="body_ar"
          rows={4}
          defaultValue={item.body_ar ?? ""}
          key={item.id + "body_ar"}
          dir="rtl"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          name="tags"
          placeholder="pricing, insurance, parking"
          defaultValue={(item.tags ?? []).join(", ")}
          key={item.id + "tags"}
        />
        <p className="text-xs text-muted-foreground">
          Comma separated. Tags group entries for staff; they are not searched.
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_published"
          defaultChecked={item.is_published}
          key={item.id + "published"}
        />
        {t("admin.publish")}
      </label>
      <p className="text-xs text-muted-foreground">
        Unpublished entries are invisible to the assistant.
      </p>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {pending ? <p className="text-sm text-muted-foreground">{t("admin.saving")}</p> : null}
    </form>
  );
}
