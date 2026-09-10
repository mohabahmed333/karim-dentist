"use client";

import { FormEvent } from "react";
import { useTranslations } from "@/lib/i18n";
import type { Faq } from "@/services/faqs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  item: Faq;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  pending: boolean;
  message: string | null;
};

export function FaqsForm({ item, onSubmit, pending, message }: Props) {
  const t = useTranslations();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onSubmit({
      question: String(form.get("question") ?? ""),
      question_ar: String(form.get("question_ar") ?? ""),
      answer: String(form.get("answer") ?? ""),
      answer_ar: String(form.get("answer_ar") ?? ""),
      is_published: form.get("is_published") === "on",
    });
  }

  return (
    <form id="faqs-form" className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
      <div className="space-y-2">
        <Label htmlFor="question">{t("admin.pages.faq.question")} (EN)</Label>
        <Input
          id="question"
          name="question"
          defaultValue={item.question}
          key={item.id + "question"}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="question_ar">{t("admin.pages.faq.question")} (AR)</Label>
        <Input
          id="question_ar"
          name="question_ar"
          defaultValue={item.question_ar ?? ""}
          key={item.id + "question_ar"}
          dir="rtl"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="answer">{t("admin.pages.faq.answer")} (EN)</Label>
        <Textarea
          id="answer"
          name="answer"
          rows={4}
          defaultValue={item.answer}
          key={item.id + "answer"}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="answer_ar">{t("admin.pages.faq.answer")} (AR)</Label>
        <Textarea
          id="answer_ar"
          name="answer_ar"
          rows={4}
          defaultValue={item.answer_ar ?? ""}
          key={item.id + "answer_ar"}
          dir="rtl"
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_published"
          defaultChecked={item.is_published}
          key={item.id + "published"}
        />
        {t("admin.publish")}
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
