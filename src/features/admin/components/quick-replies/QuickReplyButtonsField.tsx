"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/lib/i18n";
import {
  QUICK_REPLY_BUTTONS_MAX,
  QUICK_REPLY_BUTTON_TITLE_MAX,
  findButtonLabelProblems,
  type ButtonLabelProblem,
} from "@/services/whatsapp/cannedReplyInput";

export type EditableButton = { title: string; title_ar: string };

type Props = {
  value: EditableButton[];
  onChange: (value: EditableButton[]) => void;
};

const PROBLEM_KEYS = {
  duplicate_en: "admin.pages.quickReplies.buttonsDuplicateEn",
  duplicate_ar: "admin.pages.quickReplies.buttonsDuplicateAr",
  field_in_label: "admin.pages.quickReplies.buttonsFieldInLabel",
} as const satisfies Record<ButtonLabelProblem, string>;

/** Everything that blocks saving: the schema's label problems plus a button without an English label. */
export function buttonsFieldErrors(value: EditableButton[]): (ButtonLabelProblem | "empty_en")[] {
  const errors: (ButtonLabelProblem | "empty_en")[] = findButtonLabelProblems(value);
  if (value.some((button) => !button.title.trim())) errors.push("empty_en");
  return errors;
}

export function QuickReplyButtonsField({ value, onChange }: Props) {
  const t = useTranslations();
  const errors = buttonsFieldErrors(value);
  const update = (index: number, patch: Partial<EditableButton>) =>
    onChange(value.map((button, i) => (i === index ? { ...button, ...patch } : button)));

  return (
    <div className="space-y-2">
      <Label>{t("admin.pages.quickReplies.buttons")}</Label>
      <p className="text-xs text-muted-foreground">{t("admin.pages.quickReplies.buttonsHint")}</p>
      {value.map((button, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            aria-label={`${t("admin.pages.quickReplies.buttonLabelEn")} ${index + 1}`}
            placeholder={t("admin.pages.quickReplies.buttonLabelEn")}
            value={button.title}
            maxLength={QUICK_REPLY_BUTTON_TITLE_MAX}
            onChange={(event) => update(index, { title: event.target.value })}
          />
          <Input
            aria-label={`${t("admin.pages.quickReplies.buttonLabelAr")} ${index + 1}`}
            placeholder={t("admin.pages.quickReplies.buttonLabelAr")}
            dir="rtl"
            value={button.title_ar}
            maxLength={QUICK_REPLY_BUTTON_TITLE_MAX}
            onChange={(event) => update(index, { title_ar: event.target.value })}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`${t("admin.pages.quickReplies.removeButton")} ${index + 1}`}
            onClick={() => onChange(value.filter((_, i) => i !== index))}
          >
            <X className="size-4" />
          </Button>
        </div>
      ))}
      {value.length < QUICK_REPLY_BUTTONS_MAX ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...value, { title: "", title_ar: "" }])}
        >
          <Plus className="mr-1 size-4" />
          {t("admin.pages.quickReplies.addButton")}
        </Button>
      ) : null}
      {errors.map((error) => (
        <p key={error} role="alert" className="text-xs text-red-600">
          {t(error === "empty_en" ? "admin.pages.quickReplies.buttonsEmpty" : PROBLEM_KEYS[error])}
        </p>
      ))}
    </div>
  );
}
