"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "@/lib/i18n";
import type { WhatsappCannedReply } from "@/services/whatsapp/cannedReplies";
import type { CannedReplyAttachment } from "@/services/whatsapp/cannedReplyInput";
import {
  QUICK_REPLY_FIELDS,
  findUnknownFields,
  renderQuickReply,
  type QuickReplyField,
  type QuickReplyValues,
} from "@/services/whatsapp/quickReplyFields";
import { QuickReplyAttachmentField } from "./QuickReplyAttachmentField";
import {
  QuickReplyButtonsField,
  buttonsFieldErrors,
  type EditableButton,
} from "./QuickReplyButtonsField";

export const QUICK_REPLY_FORM_ID = "quick-reply-form";

const SAMPLE_VALUES: QuickReplyValues = {
  name: "Mona",
  next_appointment: "Wednesday 15 July 2026 at 10:00 am",
  appointment_service: "Teeth cleaning",
  clinic_address: "A 41 Ozone Medical Center, New Cairo",
  clinic_phone: "+20 111 192 2252",
  clinic_hours: "Sunday to Thursday, 10:00 to 18:00",
  maps_link: "https://www.google.com/maps?q=30.0074,31.4913",
};

type Props = {
  item: WhatsappCannedReply;
  categories: string[];
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  pending: boolean;
  message: string | null;
};

export function QuickReplyForm({ item, categories, onSubmit, pending, message }: Props) {
  const t = useTranslations();
  const [body, setBody] = useState(item.body);
  const [bodyAr, setBodyAr] = useState(item.body_ar ?? "");
  const [attachment, setAttachment] = useState<CannedReplyAttachment | null>(
    (item.attachment as CannedReplyAttachment | null) ?? null,
  );
  const [buttons, setButtons] = useState<EditableButton[]>(() =>
    ((item.buttons as { title: string; title_ar: string | null }[] | null) ?? []).map((button) => ({
      title: button.title,
      title_ar: button.title_ar ?? "",
    })),
  );
  const [focused, setFocused] = useState<"body" | "body_ar">("body");
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const bodyArRef = useRef<HTMLTextAreaElement>(null);
  const unknown = useMemo(
    () => [...new Set([...findUnknownFields(body), ...findUnknownFields(bodyAr)])],
    [body, bodyAr],
  );

  function insertField(field: QuickReplyField) {
    const isEnglish = focused === "body";
    const el = isEnglish ? bodyRef.current : bodyArRef.current;
    const current = isEnglish ? body : bodyAr;
    const start = el?.selectionStart ?? current.length;
    const end = el?.selectionEnd ?? current.length;
    const token = `{{${field}}}`;
    (isEnglish ? setBody : setBodyAr)(current.slice(0, start) + token + current.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + token.length, start + token.length);
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (unknown.length || buttonsFieldErrors(buttons).length) return;
    const form = new FormData(event.currentTarget);
    await onSubmit({
      slash_key: String(form.get("slash_key") ?? ""),
      title: String(form.get("title") ?? ""),
      title_ar: String(form.get("title_ar") ?? ""),
      category: String(form.get("category") ?? ""),
      body,
      body_ar: bodyAr,
      attachment,
      // The server trims labels, stores blank Arabic labels as null, and an empty list as no buttons.
      buttons: buttons.map((button) => ({ title: button.title, title_ar: button.title_ar })),
      active: form.get("active") === "on",
    });
  }

  return (
    <form id={QUICK_REPLY_FORM_ID} className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
      <div className="space-y-2">
        <Label htmlFor="slash_key">{t("admin.pages.quickReplies.slashKey")}</Label>
        <Input id="slash_key" name="slash_key" defaultValue={item.slash_key} pattern="[A-Za-z0-9_\-]+" required />
        <p className="text-xs text-muted-foreground">{t("admin.pages.quickReplies.slashKeyHint")}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">{t("admin.pages.quickReplies.titleEn")}</Label>
        <Input id="title" name="title" defaultValue={item.title} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="title_ar">{t("admin.pages.quickReplies.titleAr")}</Label>
        <Input id="title_ar" name="title_ar" defaultValue={item.title_ar ?? ""} dir="rtl" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">{t("admin.pages.quickReplies.category")}</Label>
        <Input id="category" name="category" defaultValue={item.category ?? ""} list="quick-reply-categories" />
        <datalist id="quick-reply-categories">
          {categories.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
      </div>
      <div className="space-y-2">
        <Label htmlFor="body">{t("admin.pages.quickReplies.bodyEn")}</Label>
        <Textarea
          id="body"
          ref={bodyRef}
          rows={5}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onFocus={() => setFocused("body")}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="body_ar">{t("admin.pages.quickReplies.bodyAr")}</Label>
        <Textarea
          id="body_ar"
          ref={bodyArRef}
          rows={5}
          dir="rtl"
          value={bodyAr}
          onChange={(event) => setBodyAr(event.target.value)}
          onFocus={() => setFocused("body_ar")}
        />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium">{t("admin.pages.quickReplies.insertField")}</p>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_REPLY_FIELDS.map((field) => (
            <Button
              key={field}
              type="button"
              variant="outline"
              size="sm"
              title={t(`admin.quickReplies.field.${field}` as const)}
              onClick={() => insertField(field)}
            >
              {`{{${field}}}`}
            </Button>
          ))}
        </div>
      </div>
      {unknown.length ? (
        <p role="alert" className="text-sm text-red-600">
          {t("admin.pages.quickReplies.unknownFields")} {unknown.map((field) => `{{${field}}}`).join(", ")}
        </p>
      ) : null}
      <div className="space-y-1 rounded-md bg-muted/50 p-3">
        <p className="text-xs font-medium text-muted-foreground">{t("admin.pages.quickReplies.preview")}</p>
        <p className="whitespace-pre-wrap text-sm">{renderQuickReply(body, SAMPLE_VALUES).text}</p>
        {bodyAr.trim() ? (
          <p dir="rtl" className="whitespace-pre-wrap text-sm">
            {renderQuickReply(bodyAr, SAMPLE_VALUES).text}
          </p>
        ) : null}
        {buttons.some((button) => button.title.trim()) ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {buttons
              .filter((button) => button.title.trim())
              .map((button, index) => (
                <span
                  key={index}
                  className="rounded-full border border-[#D1D5DB] bg-white px-2.5 py-0.5 text-xs text-[#374151]"
                >
                  {button.title.trim()}
                </span>
              ))}
          </div>
        ) : null}
      </div>
      <QuickReplyAttachmentField value={attachment} onChange={setAttachment} />
      <QuickReplyButtonsField value={buttons} onChange={setButtons} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="active" defaultChecked={item.active} />
        {t("admin.pages.quickReplies.active")}
      </label>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {pending ? <p className="text-sm text-muted-foreground">{t("admin.saving")}</p> : null}
    </form>
  );
}
