"use client";

import { FormEvent, useState } from "react";
import type { Service } from "@/services/services";
import { formatPriceRangeLabel } from "@/services/service_doctors/pricing";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "@/lib/i18n";

type Props = {
  item: Service;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  pending: boolean;
  message: string | null;
};

export function ServicesForm({ item, onSubmit, pending, message }: Props) {
  const t = useTranslations();
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
        <Label htmlFor="kind">{t("admin.pages.services.kind")}</Label>
        <select
          id="kind"
          name="kind"
          defaultValue={item.kind ?? "our_services"}
          key={item.id + "kind"}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="our_services">{t("admin.pages.services.ourServices")}</option>
          <option value="laser">{t("admin.pages.services.laser")}</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">{t("admin.cms.titleEn")}</Label>
        <Input
          id="title"
          name="title"
          defaultValue={item.title}
          key={item.id + "title"}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="title_ar">{t("admin.cms.titleAr")}</Label>
        <Input
          id="title_ar"
          name="title_ar"
          defaultValue={item.title_ar ?? ""}
          key={item.id + "title_ar"}
          dir="rtl"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tags">{t("admin.pages.services.tagsLabel")}</Label>
        <Textarea
          id="tags"
          name="tags"
          rows={3}
          defaultValue={(item.tags ?? []).join("\n")}
          key={item.id + "tags"}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">{t("admin.cms.descriptionEn")}</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={item.description}
          key={item.id + "description"}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description_ar">{t("admin.cms.descriptionAr")}</Label>
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
        <Label htmlFor="image_url">{t("admin.cms.imageUrl")}</Label>
        <Input
          id="image_url"
          name="image_url"
          defaultValue={item.image_url ?? ""}
          key={item.id + "image_url"}
        />
      </div>
      <div className="space-y-2">
        <Label>{t("admin.pages.services.priceLabel")}</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="price_min_egp" className="text-xs font-normal text-muted-foreground">
              {t("admin.pages.services.priceMin")}
            </Label>
            <Input
              id="price_min_egp"
              name="price_min_egp"
              type="number"
              min={0}
              step={1}
              placeholder={t("admin.pages.services.priceMinPlaceholder")}
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              key={item.id + "price_min_egp"}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="price_max_egp" className="text-xs font-normal text-muted-foreground">
              {t("admin.pages.services.priceMax")}
            </Label>
            <Input
              id="price_max_egp"
              name="price_max_egp"
              type="number"
              min={0}
              step={1}
              placeholder={t("admin.pages.services.priceMaxPlaceholder")}
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              key={item.id + "price_max_egp"}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {previewLabel
            ? t("admin.pages.services.pricePreview").replace("{label}", previewLabel)
            : t("admin.pages.services.priceEmpty")}
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_published"
          defaultChecked={item.is_published}
          key={item.id + "published"}
        />
        {t("admin.cms.published")}
      </label>
      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}
      {pending ? (
        <p className="text-sm text-muted-foreground">{t("admin.saving")}</p>
      ) : null}
    </form>
  );
}
