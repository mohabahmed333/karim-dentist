"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useTranslations } from "@/lib/i18n";

export type TemplateProposal = {
  kind: string;
  title: string;
  names: { en: string; ar: string };
  category: "UTILITY" | "MARKETING";
  params: string[];
  bodyEn: string;
  bodyAr: string;
};

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard access can be refused; the text is on screen to select.
        }
      }}
      className="shrink-0 rounded border border-[var(--admin-border,#e5e7eb)] bg-[var(--admin-panel,#fff)] p-1 text-[var(--admin-muted)] hover:text-[var(--admin-fg,#111)]"
    >
      {copied ? <Check aria-hidden className="size-3.5" /> : <Copy aria-hidden className="size-3.5" />}
    </button>
  );
}

function Body({ name, language, languageLabel, text }: { name: string; language: string; languageLabel: string; text: string }) {
  const t = useTranslations();
  return (
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[11px] text-[var(--admin-muted)]">
          {name} · {languageLabel}
        </p>
        <p dir={language === "ar" ? "rtl" : "ltr"} className="text-xs leading-relaxed">
          {text}
        </p>
      </div>
      <CopyButton
        text={text}
        label={t("admin.pages.templates.copyBody").replace("{language}", languageLabel).replace("{name}", name)}
      />
    </div>
  );
}

/**
 * The exact text to submit to Meta for a message that has no template.
 *
 * Staff kept reading "no template" as something to wait for rather than
 * something to do, so the row carries the thing they would otherwise have to
 * write themselves. Same source as the runbook — TEMPLATE_PROPOSALS.
 */
export function TemplateProposalCard({ proposal }: { proposal: TemplateProposal }) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-1.5 rounded-md border border-[var(--admin-border,#e5e7eb)] bg-[var(--admin-panel,#fff)]">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="w-full px-2.5 py-1.5 text-left text-xs text-[var(--admin-muted)] hover:text-[var(--admin-fg,#111)]"
      >
        {t(open ? "admin.pages.templates.hideText" : "admin.pages.templates.showText").replace(
          "{title}",
          proposal.title.toLowerCase(),
        )}
      </button>

      {open ? (
        <div className="space-y-2 border-t border-[var(--admin-border,#e5e7eb)] px-2.5 py-2">
          <p className="text-xs text-[var(--admin-muted)]">
            {t("admin.pages.templates.submitInstructions").replace("{category}", proposal.category)}
          </p>
          <p className="text-[11px] text-[var(--admin-muted)]">
            {proposal.params.map((name, i) => `{{${i + 1}}} ${name}`).join(" · ")}
          </p>
          <Body name={proposal.names.en} language="en" languageLabel={t("admin.pages.templates.englishLabel")} text={proposal.bodyEn} />
          <Body name={proposal.names.ar} language="ar" languageLabel={t("admin.pages.templates.arabicLabel")} text={proposal.bodyAr} />
        </div>
      ) : null}
    </div>
  );
}
