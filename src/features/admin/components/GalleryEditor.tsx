"use client";

import { useTranslations } from "@/lib/i18n";
import { useState } from "react";
import { toast } from "sonner";
import type { GalleryComparison } from "@/services/dental/types";
import {
  createGalleryComparison,
  deleteGalleryComparison,
  updateGalleryComparison,
} from "@/services/dental/mutations";
import { LocalizedAdminPageHeader } from "./LocalizedAdminPageHeader";
import { MediaUploadField } from "./MediaUploadField";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  comparisons: GalleryComparison[];
};

export function GalleryEditor({ comparisons: initialComparisons }: Props) {
  const t = useTranslations();
  const [comparisons, setComparisons] = useState(initialComparisons);
  const [pending, setPending] = useState(false);

  async function addComparison() {
    setPending(true);
    try {
      const row = await createGalleryComparison({
        sort_order: comparisons.length,
      });
      setComparisons((prev) => [...prev, row]);
      toast.success(t("admin.pages.gallery.itemAdded"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.cms.addFailed"));
    } finally {
      setPending(false);
    }
  }

  async function saveComparison(
    item: GalleryComparison,
    partial: Partial<GalleryComparison>,
  ) {
    setPending(true);
    try {
      const row = await updateGalleryComparison(item.id, partial);
      setComparisons((prev) => prev.map((i) => (i.id === row.id ? row : i)));
      toast.success(t("admin.cms.saveSuccess"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.saveFailed"));
    } finally {
      setPending(false);
    }
  }

  async function removeComparison(id: string) {
    setPending(true);
    try {
      await deleteGalleryComparison(id);
      setComparisons((prev) => prev.filter((i) => i.id !== id));
      toast.success(t("admin.cms.removed"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.cms.deleteFailed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-8">
      <LocalizedAdminPageHeader
        titleKey="admin.pages.gallery.title"
        descriptionKey="admin.pages.gallery.description"
      />
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">Before / after</h2>
        <Button onClick={() => void addComparison()} disabled={pending}>
          Add comparison
        </Button>
      </div>
      <div className="grid gap-4">
        {comparisons.map((item, index) => (
          <ComparisonCard
            key={item.id}
            item={item}
            index={index}
            pending={pending}
            onSave={saveComparison}
            onRemove={() => void removeComparison(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ComparisonCard({
  item,
  index,
  pending,
  onSave,
  onRemove,
}: {
  item: GalleryComparison;
  index: number;
  pending: boolean;
  onSave: (
    item: GalleryComparison,
    partial: Partial<GalleryComparison>,
  ) => Promise<void>;
  onRemove: () => void;
}) {
  const [beforeUrl, setBeforeUrl] = useState(item.before_image_url);
  const [afterUrl, setAfterUrl] = useState(item.after_image_url);

  return (
    <Card className="gap-0 p-4">
      <p className="mb-3 text-sm font-medium">Comparison {index + 1}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <MediaUploadField
          label="Before image"
          bucket="about"
          folder="gallery"
          mediaType="image"
          onMediaTypeChange={() => undefined}
          value={beforeUrl || null}
          onChange={(url) => setBeforeUrl(url ?? "")}
        />
        <MediaUploadField
          label="After image"
          bucket="about"
          folder="gallery"
          mediaType="image"
          onMediaTypeChange={() => undefined}
          value={afterUrl || null}
          onChange={(url) => setAfterUrl(url ?? "")}
        />
      </div>
      <div className="mt-3 space-y-3">
        <div className="space-y-2">
          <Label>Alt text</Label>
          <Input
            defaultValue={item.alt_text}
            onBlur={(e) => void onSave(item, { alt_text: e.target.value })}
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={() =>
              void onSave(item, {
                before_image_url: beforeUrl,
                after_image_url: afterUrl,
              })
            }
          >
            Save images
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={pending}
            onClick={onRemove}
          >
            Remove
          </Button>
        </div>
      </div>
    </Card>
  );
}
