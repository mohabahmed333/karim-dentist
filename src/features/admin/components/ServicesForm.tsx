"use client";

import { FormEvent, useState } from "react";
import type { Service } from "@/services/services";
import { formatPriceRangeLabel } from "@/services/service_doctors/pricing";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  item: Service;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  pending: boolean;
  message: string | null;
};

export function ServicesForm({ item, onSubmit, pending, message }: Props) {
  const [priceMin, setPriceMin] = useState(item.price_min_egp?.toString() ?? "");
  const [priceMax, setPriceMax] = useState(item.price_max_egp?.toString() ?? "");
  const previewLabel = formatPriceRangeLabel(
    priceMin.trim() ? Number(priceMin) : null,
    priceMax.trim() ? Number(priceMax) : null,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const tags = String(form.get("tags") ?? "")
      .split(/\n|,/)
      .map((part) => part.trim())
      .filter(Boolean);
    const min = String(form.get("price_min_egp") ?? "").trim();
    const max = String(form.get("price_max_egp") ?? "").trim();
    await onSubmit({
      title: String(form.get("title") ?? ""),
      title_ar: String(form.get("title_ar") ?? ""),
      description: String(form.get("description") ?? ""),
      description_ar: String(form.get("description_ar") ?? ""),
      kind: String(form.get("kind") ?? "our_services"),
      tags,
      image_url: String(form.get("image_url") ?? "") || null,
      price_min_egp: min ? Number(min) : null,
      price_max_egp: max ? Number(max) : null,
      is_published: form.get("is_published") === "on",
    });
  }

  return (
    <form
      id="services-form"
      className="space-y-4"
      onSubmit={(e) => void handleSubmit(e)}
    >
      <div className="space-y-2">
        <Label htmlFor="kind">Kind</Label>
        <select
          id="kind"
          name="kind"
          defaultValue={item.kind ?? "our_services"}
          key={item.id + "kind"}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="our_services">Our Services</option>
          <option value="laser">Laser treatments</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Title (EN)</Label>
        <Input
          id="title"
          name="title"
          defaultValue={item.title}
          key={item.id + "title"}
        />
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
        <Label htmlFor="tags">Tags (one per line)</Label>
        <Textarea
          id="tags"
          name="tags"
          rows={3}
          defaultValue={(item.tags ?? []).join("\n")}
          key={item.id + "tags"}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description (EN)</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={item.description}
          key={item.id + "description"}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description_ar">Description (AR)</Label>
        <Textarea
          id="description_ar"
          name="description_ar"
          rows={3}
          defaultValue={item.description_ar ?? ""}
          key={item.id + "description_ar"}
          dir="rtl"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="image_url">Image URL</Label>
        <Input
          id="image_url"
          name="image_url"
          defaultValue={item.image_url ?? ""}
          key={item.id + "image_url"}
        />
      </div>
      <div className="space-y-2">
        <Label>Price (shown to patients, e.g. on WhatsApp)</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="price_min_egp" className="text-xs font-normal text-muted-foreground">
              Minimum price (EGP)
            </Label>
            <Input
              id="price_min_egp"
              name="price_min_egp"
              type="number"
              min={0}
              step={1}
              placeholder="e.g. 300"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              key={item.id + "price_min_egp"}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="price_max_egp" className="text-xs font-normal text-muted-foreground">
              Maximum price (EGP)
            </Label>
            <Input
              id="price_max_egp"
              name="price_max_egp"
              type="number"
              min={0}
              step={1}
              placeholder="e.g. 600, or same as minimum for one figure"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              key={item.id + "price_max_egp"}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {previewLabel
            ? `Patients will see: ${previewLabel}`
            : "Leave both blank for no price on file."}
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_published"
          defaultChecked={item.is_published}
          key={item.id + "published"}
        />
        Published
      </label>
      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}
      {pending ? (
        <p className="text-sm text-muted-foreground">Saving…</p>
      ) : null}
    </form>
  );
}
