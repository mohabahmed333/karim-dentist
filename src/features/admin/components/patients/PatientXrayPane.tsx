"use client";

import Image from "next/image";
import { FileText, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminInput } from "@/features/admin/ui";
import { Label } from "@/components/ui/label";
import {
  AdminSelect,
  AdminSelectContent,
  AdminSelectItem,
  AdminSelectTrigger,
  AdminSelectValue,
} from "@/features/admin/ui";
import { useTranslations, type AdminMessageKey } from "@/lib/i18n";
import type { ImagingKind, PatientImaging } from "@/services/patient_imaging";
import type { usePatientImaging } from "./usePatientImaging";

type Chart = ReturnType<typeof usePatientImaging>;

type Props = {
  chart: Chart;
};

const KIND_LABEL_KEYS: Record<ImagingKind, AdminMessageKey> = {
  xray: "admin.patients.xray.kindXray",
  cbct: "admin.patients.xray.kindCbct",
  photo: "admin.patients.xray.kindPhoto",
};

function isImage(mime: string) {
  return mime.startsWith("image/");
}

export function PatientXrayPane({ chart }: Props) {
  const t = useTranslations();
  const { items, draft, setDraft, pending, upload, setViewerId, setDeleteId } =
    chart;

  function formatDate(value: string | null) {
    if (!value) return t("admin.patients.xray.noDate");
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <section className="mt-5 space-y-5">
      <div className="rounded-[28px] bg-[#fafafa] p-5">
        <h2 className="mb-4 text-[15px] font-medium text-[#111111]">
          {t("admin.patients.xray.uploadTitle")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="xray-title">{t("admin.patients.xray.title")}</Label>
            <AdminInput
              id="xray-title"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder={t("admin.patients.xray.titlePlaceholder")}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("admin.patients.xray.kind")}</Label>
            <AdminSelect
              value={draft.kind}
              onValueChange={(value) => {
                if (!value) return;
                setDraft({ ...draft, kind: value as ImagingKind });
              }}
            >
              <AdminSelectTrigger className="w-full">
                <AdminSelectValue />
              </AdminSelectTrigger>
              <AdminSelectContent>
                <AdminSelectItem value="xray">{t("admin.patients.xray.kindXray")}</AdminSelectItem>
                <AdminSelectItem value="cbct">{t("admin.patients.xray.kindCbct")}</AdminSelectItem>
                <AdminSelectItem value="photo">{t("admin.patients.xray.kindPhoto")}</AdminSelectItem>
              </AdminSelectContent>
            </AdminSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="xray-tooth">{t("admin.patients.xray.tooth")}</Label>
            <AdminInput
              id="xray-tooth"
              inputMode="numeric"
              value={draft.toothNumber}
              onChange={(e) =>
                setDraft({ ...draft, toothNumber: e.target.value })
              }
              placeholder={t("admin.patients.xray.toothPlaceholder")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="xray-taken">{t("admin.patients.xray.takenDate")}</Label>
            <AdminInput
              id="xray-taken"
              type="date"
              value={draft.takenAt}
              onChange={(e) => setDraft({ ...draft, takenAt: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="xray-file">{t("admin.patients.xray.file")}</Label>
            <AdminInput
              id="xray-file"
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) =>
                setDraft({ ...draft, file: e.target.files?.[0] ?? null })
              }
            />
          </div>
        </div>
        <div className="mt-4">
          <Button type="button" disabled={pending} onClick={() => void upload()}>
            <Upload className="size-4" />
            {pending ? t("admin.patients.xray.uploading") : t("admin.patients.xray.upload")}
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="rounded-[28px] bg-[#fafafa] px-5 py-10 text-center text-sm text-[#6b7280]">
          {t("admin.patients.xray.empty")}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <XrayCard
              key={item.id}
              item={item}
              onOpen={() => setViewerId(item.id)}
              onDelete={() => setDeleteId(item.id)}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}

      <XrayViewer
        item={chart.viewer}
        open={Boolean(chart.viewer)}
        onOpenChange={(open) => {
          if (!open) setViewerId(null);
        }}
      />
    </section>
  );
}

function XrayCard({
  item,
  onOpen,
  onDelete,
  formatDate,
}: {
  item: PatientImaging;
  onOpen: () => void;
  onDelete: () => void;
  formatDate: (value: string | null) => string;
}) {
  const t = useTranslations();
  return (
    <article className="overflow-hidden rounded-[24px] bg-[#fafafa]">
      <button
        type="button"
        onClick={onOpen}
        className="relative block aspect-[4/3] w-full overflow-hidden bg-[#111111]"
      >
        {isImage(item.mime_type) ? (
          <Image
            src={item.file_url}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
          />
        ) : (
          <span className="flex h-full flex-col items-center justify-center gap-2 text-white/70">
            <FileText className="size-8" />
            <span className="text-xs">PDF</span>
          </span>
        )}
      </button>
      <div className="flex items-start justify-between gap-2 px-3 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[#111111]">
            {item.title}
          </p>
          <p className="mt-0.5 text-[11px] text-[#6b7280]">
            {t(KIND_LABEL_KEYS[item.kind])}
            {item.tooth_number != null
              ? t("admin.patients.xray.toothNumberSuffix").replace("{n}", String(item.tooth_number))
              : ""}
            {" · "}
            {formatDate(item.taken_at ?? item.created_at)}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("admin.patients.xray.deleteAria").replace("{title}", item.title)}
          onClick={onDelete}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </article>
  );
}

function XrayViewer({
  item,
  open,
  onOpenChange,
}: {
  item: PatientImaging | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{item?.title ?? t("admin.patients.xray.viewerDefaultTitle")}</DialogTitle>
        </DialogHeader>
        {item ? (
          isImage(item.mime_type) ? (
            <div className="relative mx-auto aspect-square w-full max-h-[70vh] overflow-hidden rounded-xl bg-[#111111]">
              <Image
                src={item.file_url}
                alt={item.title}
                fill
                className="object-contain"
                sizes="80vw"
                unoptimized
              />
            </div>
          ) : (
            <iframe
              title={item.title}
              src={item.file_url}
              className="h-[70vh] w-full rounded-xl"
            />
          )
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
