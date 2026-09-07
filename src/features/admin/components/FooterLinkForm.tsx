"use client";

import { FormEvent } from "react";
import type { FooterLink } from "@/services/footer_links";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FOOTER_ICON_PRESETS } from "@/features/portfolio/lib/footerIcons";

type Props = {
  item: FooterLink;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  pending: boolean;
  message: string | null;
};

export function FooterLinkForm({ item, onSubmit, pending, message }: Props) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const display_mode = String(form.get("display_mode") ?? "text");
    const icon_key = String(form.get("icon_key") ?? "");
    await onSubmit({
      label: String(form.get("label") ?? ""),
      label_ar: String(form.get("label_ar") ?? ""),
      href: String(form.get("href") ?? ""),
      column_key: String(form.get("column_key") ?? "portfolio"),
      sort_order: Number(form.get("sort_order") ?? item.sort_order),
      display_mode,
      icon_key: icon_key || null,
      icon_url: String(form.get("icon_url") ?? "") || null,
    });
  }

  return (
    <form
      id="footer-link-form"
      className="space-y-4"
      onSubmit={(e) => void handleSubmit(e)}
    >
      <div className="space-y-2">
        <Label htmlFor="label">Label (EN)</Label>
        <Input
          id="label"
          name="label"
          defaultValue={item.label}
          key={item.id + "label"}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="label_ar">Label (AR)</Label>
        <Input
          id="label_ar"
          name="label_ar"
          defaultValue={item.label_ar ?? ""}
          key={item.id + "label_ar"}
          dir="rtl"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="href">URL / anchor</Label>
        <Input
          id="href"
          name="href"
          defaultValue={item.href}
          key={item.id + "href"}
          placeholder="#about or https://…"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="column_key">Column</Label>
        <select
          id="column_key"
          name="column_key"
          defaultValue={item.column_key}
          key={item.id + "col"}
          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="portfolio">Links</option>
          <option value="follow">Follow Us</option>
          <option value="resources">Resources (hidden)</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="display_mode">Display</Label>
        <select
          id="display_mode"
          name="display_mode"
          defaultValue={item.display_mode ?? "text"}
          key={item.id + "display"}
          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="text">Text</option>
          <option value="icon">Icon</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="icon_key">Preset icon</Label>
        <select
          id="icon_key"
          name="icon_key"
          defaultValue={item.icon_key ?? ""}
          key={item.id + "icon"}
          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="">None</option>
          {FOOTER_ICON_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="icon_url">Custom icon URL</Label>
        <Input
          id="icon_url"
          name="icon_url"
          defaultValue={item.icon_url ?? ""}
          key={item.id + "iconurl"}
          placeholder="Optional upload URL"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sort_order">Sort order</Label>
        <Input
          id="sort_order"
          name="sort_order"
          type="number"
          defaultValue={item.sort_order}
          key={item.id + "sort"}
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
