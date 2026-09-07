"use client";

import { useTranslations } from "@/lib/i18n";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import {
  joinCalloutBody,
  splitCalloutBody,
} from "@/features/portfolio/lib/calloutParts";
import { updateCallout, type Callout } from "@/services/callouts";
import { LocalizedAdminPageHeader } from "./LocalizedAdminPageHeader";
import { CalloutLeadImageField } from "./CalloutLeadImageField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = { callout: Callout | null };

export function CalloutEditor({ callout: initial }: Props) {
  const t = useTranslations();
  const [callout] = useState(initial);
  const [leadImage, setLeadImage] = useState(initial?.lead_image_url ?? "");
  const [lead, setLead] = useState(
    () => splitCalloutBody(initial?.body ?? "").lead,
  );
  const [accent, setAccent] = useState(
    () => splitCalloutBody(initial?.body ?? "").accent,
  );
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!callout) {
      toast.error("No callout row yet — push migrations first.");
      return;
    }
    setPending(true);
    try {
      await updateCallout(callout.id, {
        body: joinCalloutBody(lead, accent),
        lead_image_url: leadImage || null,
      });
      toast.success(t("admin.cms.saveSuccess"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.saveFailed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <LocalizedAdminPageHeader
        titleKey="admin.pages.callout.title"
        descriptionKey="admin.pages.callout.description"
        actions={
          <Button type="submit" form="callout-form" disabled={pending}>
            {pending ? t("admin.saving") : t("admin.saveChanges")}
          </Button>
        }
      />
      <form id="callout-form" className="space-y-6" onSubmit={(e) => void onSubmit(e)}>
        <Card>
          <CardHeader>
            <CardTitle>Script</CardTitle>
            <CardDescription>
              Upload a script image or use text for the large callout lines.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CalloutLeadImageField
              value={leadImage || null}
              onChange={(url) => setLeadImage(url ?? "")}
            />
            <div className="space-y-2">
              <Label htmlFor="callout-lead">Big script text (fallback)</Label>
              <Textarea
                id="callout-lead"
                rows={3}
                value={lead}
                onChange={(e) => setLead(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                One line per row, or one line to auto-wrap.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Overlay</CardTitle>
            <CardDescription>
              Smaller line that sits over the script.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="callout-accent">Overlay text</Label>
              <Textarea
                id="callout-accent"
                rows={2}
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? t("admin.saving") : t("admin.saveChanges")}
          </Button>
        </div>
      </form>
    </div>
  );
}
