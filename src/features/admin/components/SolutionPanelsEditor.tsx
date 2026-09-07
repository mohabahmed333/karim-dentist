"use client";

import { useTranslations } from "@/lib/i18n";
import { useState } from "react";
import { toast } from "sonner";
import type { SolutionPanel } from "@/services/dental/types";
import { updateSolutionPanel } from "@/services/dental/mutations";
import { LocalizedAdminPageHeader } from "./LocalizedAdminPageHeader";
import { MediaUploadField } from "./MediaUploadField";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = { panels: SolutionPanel[] };

export function SolutionPanelsEditor({ panels: initial }: Props) {
  const t = useTranslations();
  const [panels, setPanels] = useState(initial);
  const [pending, setPending] = useState(false);

  async function savePanel(
    panel: SolutionPanel,
    partial: Partial<SolutionPanel>,
  ) {
    setPending(true);
    try {
      const row = await updateSolutionPanel(panel.id, partial);
      setPanels((prev) => prev.map((entry) => (entry.id === row.id ? row : entry)));
      toast.success(t("admin.cms.saveSuccess"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.saveFailed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <LocalizedAdminPageHeader
        titleKey="admin.pages.solutions.title"
        descriptionKey="admin.pages.solutions.description"
      />
      <div className="grid gap-4">
        {panels.map((panel) => (
          <PanelCard
            key={panel.id}
            panel={panel}
            pending={pending}
            onSave={savePanel}
          />
        ))}
      </div>
    </div>
  );
}

function PanelCard({
  panel,
  pending,
  onSave,
}: {
  panel: SolutionPanel;
  pending: boolean;
  onSave: (panel: SolutionPanel, partial: Partial<SolutionPanel>) => Promise<void>;
}) {
  const [imageUrl, setImageUrl] = useState(panel.image_url);

  return (
    <Card className="gap-0 p-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <MediaUploadField
          label="Panel image"
          bucket="about"
          folder="solutions"
          mediaType="image"
          onMediaTypeChange={() => undefined}
          value={imageUrl || null}
          onChange={(url) => setImageUrl(url ?? "")}
        />
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              defaultValue={panel.title}
              onBlur={(e) => void onSave(panel, { title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Body</Label>
            <Textarea
              defaultValue={panel.body}
              rows={3}
              onBlur={(e) => void onSave(panel, { body: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Link href</Label>
            <Input
              defaultValue={panel.link_href ?? ""}
              onBlur={(e) => void onSave(panel, { link_href: e.target.value || null })}
            />
          </div>
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={() => void onSave(panel, { image_url: imageUrl })}
          >
            Save image
          </Button>
        </div>
      </div>
    </Card>
  );
}
