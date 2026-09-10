"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "@/lib/i18n";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AdminInput,
  AdminSelect,
  AdminSelectContent,
  AdminSelectItem,
  AdminSelectTrigger,
  AdminSelectValue,
} from "@/features/admin/ui";
import type { TemplateField } from "@/services/whatsapp/templateFields";
import { templateDummyDefaults } from "@/services/whatsapp/templateDefaultValues";

type TemplateRow = {
  id: string;
  name: string;
  language: string;
  parameterFormat: string;
  fields: TemplateField[];
  supported: boolean;
};

export type TemplateSendPayload = {
  name: string;
  language: string;
  parameterFormat: "POSITIONAL" | "NAMED";
  fields: TemplateField[];
  values: Record<string, string>;
};

type Props = {
  conversationId: string;
  sending?: boolean;
  /** locked = session expired (required). optional = open session via + menu. */
  mode?: "locked" | "optional";
  onDismiss?: () => void;
  onSendTemplate: (payload: TemplateSendPayload) => Promise<boolean>;
};

export function SessionExpiredTemplatePanel({
  conversationId,
  sending,
  mode = "locked",
  onDismiss,
  onSendTemplate,
}: Props) {
  const t = useTranslations();
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const res = await fetch("/api/v1/whatsapp/templates");
        const data = (await res.json()) as {
          templates?: TemplateRow[];
          code?: string;
        };
        if (!res.ok) {
          if (!cancelled) {
            setError(
              data.code === "MISSING_WABA"
                ? t("admin.frontDesk.templateMissingWaba")
                : t("admin.frontDesk.templateListError"),
            );
            setTemplates([]);
          }
          return;
        }
        if (!cancelled) setTemplates(data.templates ?? []);
      } catch {
        if (!cancelled) {
          setError(t("admin.frontDesk.templateListError"));
          setTemplates([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const selected = useMemo(
    () =>
      templates.find((tpl) => `${tpl.name}::${tpl.language}` === selectedKey) ??
      null,
    [templates, selectedKey],
  );

  useEffect(() => {
    if (!selected) {
      setValues({});
      return;
    }
    setValues(templateDummyDefaults(selected.fields, selected.language));
  }, [selected, conversationId]);

  async function handleSend() {
    if (!selected || !selected.supported) return;
    for (const field of selected.fields) {
      if (!(values[`${field.section}.${field.key}`] ?? "").trim()) {
        toast.error(t("admin.frontDesk.templateMissingParams"));
        return;
      }
    }
    const ok = await onSendTemplate({
      name: selected.name,
      language: selected.language,
      parameterFormat:
        selected.parameterFormat === "NAMED" ? "NAMED" : "POSITIONAL",
      fields: selected.fields,
      values,
    });
    if (ok) {
      setSelectedKey("");
      setValues({});
      if (mode === "optional") onDismiss?.();
    }
  }

  const sendable = templates.filter((tpl) => tpl.supported);
  const unsupportedCount = templates.length - sendable.length;

  return (
    <div className="border-t border-[#E5E7EB] bg-[#F9FAFB] px-4 py-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#111827]">
            {mode === "optional"
              ? t("admin.frontDesk.templateOptionalTitle")
              : t("admin.frontDesk.sessionExpiredTitle")}
          </p>
          <p className="mt-1 text-xs text-[#6B7280]">
            {mode === "optional"
              ? t("admin.frontDesk.templateOptionalBody")
              : t("admin.frontDesk.sessionExpiredBody")}
          </p>
        </div>
        {mode === "optional" && onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded-md p-1 text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#111827]"
            aria-label={t("admin.frontDesk.templateDismiss")}
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {loading ? (
        <div
          className="mt-3 space-y-3"
          aria-busy="true"
          aria-label={t("admin.frontDesk.templateLoading")}
        >
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-16 bg-[#E8EAED]" />
            <Skeleton className="h-10 w-full rounded-md bg-[#E8EAED]" />
          </div>
          <Skeleton className="h-9 w-28 rounded-md bg-[#E8EAED]" />
        </div>
      ) : error ? (
        <p className="mt-3 text-xs text-[#B91C1C]">{error}</p>
      ) : sendable.length === 0 ? (
        <p className="mt-3 text-xs text-[#6B7280]">
          {t("admin.frontDesk.templateEmpty")}
          {unsupportedCount > 0
            ? ` ${t("admin.frontDesk.templateUnsupportedHint")}`
            : ""}
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#374151]">
              {t("admin.frontDesk.templatePick")}
            </label>
            <AdminSelect
              value={selectedKey}
              onValueChange={(next) => setSelectedKey((next as string) ?? "")}
              disabled={sending}
            >
              <AdminSelectTrigger className="w-full">
                <AdminSelectValue
                  placeholder={t("admin.frontDesk.templatePickPlaceholder")}
                />
              </AdminSelectTrigger>
              <AdminSelectContent>
                {sendable.map((tpl) => (
                  <AdminSelectItem
                    key={`${tpl.name}::${tpl.language}`}
                    value={`${tpl.name}::${tpl.language}`}
                  >
                    {tpl.name} ({tpl.language})
                  </AdminSelectItem>
                ))}
              </AdminSelectContent>
            </AdminSelect>
          </div>

          {selected?.fields.map((field) => {
            const id = `${field.section}.${field.key}`;
            return (
              <label
                key={id}
                className="block text-xs font-medium text-[#374151]"
              >
                {field.section === "header"
                  ? t("admin.frontDesk.templateHeaderParam")
                  : t("admin.frontDesk.templateBodyParam")}{" "}
                {field.label}
                <AdminInput
                  className="mt-1"
                  value={values[id] ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [id]: e.target.value }))
                  }
                  disabled={sending}
                />
              </label>
            );
          })}

          <button
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-md bg-[#111827] px-4 text-sm font-medium text-white disabled:opacity-50"
            disabled={!selected || sending}
            onClick={() => void handleSend()}
          >
            {sending
              ? t("admin.frontDesk.templateSending")
              : t("admin.frontDesk.templateSend")}
          </button>
        </div>
      )}
    </div>
  );
}
