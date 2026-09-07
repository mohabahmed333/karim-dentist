"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Info,
  RefreshCw,
} from "lucide-react";
import type { TreatmentItem } from "@/services/patient_treatments";
import { isRichTextEmpty, RichTextHtml } from "../richTextUtils";
import { TreatmentAppointmentCard } from "./TreatmentAppointmentCard";
import { TreatmentAttachmentsPreview } from "./TreatmentAttachmentsPreview";

type Props = {
  item: TreatmentItem;
  expanded: boolean;
  onToggle: () => void;
  onBook: () => void;
  onReplace: () => void;
  onContext: (anchor: DOMRect) => void;
};

export function TreatmentAccordionItem({
  item,
  expanded,
  onToggle,
  onBook,
  onReplace,
  onContext,
}: Props) {
  const critical = item.severity === "Critical";
  const hasAppointment = Boolean(item.appointment);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
    >
      <button
        type="button"
        onClick={onToggle}
        onContextMenu={(e) => {
          e.preventDefault();
          onContext(e.currentTarget.getBoundingClientRect());
        }}
        className="flex w-full items-center gap-3 px-4 py-3 text-start"
      >
        {critical ? (
          <AlertTriangle className="size-4 shrink-0 text-[#991B1B]" />
        ) : (
          <Info className="size-4 shrink-0 text-[#92400E]" />
        )}
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#0F172A]">
          {item.toothName}
          {item.toothFdi ? (
            <span className="ms-1 font-normal text-[#64748B]">
              · {item.toothFdi}
            </span>
          ) : null}
          {item.cdtCode ? (
            <span className="ms-1.5 font-mono text-[11px] font-medium text-[#2563EB]">
              {item.cdtCode}
            </span>
          ) : null}
        </span>
        {item.appointment?.status === "confirmed" ? (
          <span className="rounded-full bg-[#D1FAE5] px-2 py-0.5 text-[10px] font-semibold text-[#065F46]">
            Confirmed
          </span>
        ) : item.status === "scheduled" ? (
          <span className="rounded-full bg-[#DBEAFE] px-2 py-0.5 text-[10px] font-semibold text-[#1E40AF]">
            Scheduled
          </span>
        ) : null}
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
            critical
              ? "bg-[#FEE2E2] text-[#991B1B]"
              : "bg-[#FEF3C7] text-[#92400E]"
          }`}
        >
          {item.severity}
        </span>
        {expanded ? (
          <ChevronUp className="size-4 text-gray-500" />
        ) : (
          <ChevronDown className="size-4 text-gray-500" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-slate-100 px-4 pb-4 pt-1">
              {!isRichTextEmpty(item.lastTreatment) ? (
                <div className="flex items-start gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2.5 text-[12px] text-[#64748B]">
                  <Clock className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                  <div className="min-w-0 flex-1">
                    <p className="mb-1 font-medium text-[#0F172A]">
                      Last treatment
                    </p>
                    <RichTextHtml html={item.lastTreatment} />
                  </div>
                </div>
              ) : null}

              {item.aiInsight ? <InsightBox insight={item.aiInsight} /> : null}

              {item.attachments.length > 0 ? (
                <TreatmentAttachmentsPreview attachments={item.attachments} />
              ) : null}

              {item.appointment ? (
                <TreatmentAppointmentCard appointment={item.appointment} />
              ) : null}

              {hasAppointment ? (
                <button
                  type="button"
                  onClick={onReplace}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF3C7] px-3 py-1.5 text-[12px] font-medium text-[#92400E] transition hover:bg-[#FDE68A]"
                >
                  <RefreshCw className="size-3.5" />
                  Replace appointment
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onBook}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#DBEAFE] px-3 py-1.5 text-[12px] font-medium text-[#1E40AF] transition hover:bg-[#BFDBFE]"
                >
                  <Calendar className="size-3.5" />
                  Book Now
                </button>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
}

function InsightBox({
  insight,
}: {
  insight: NonNullable<TreatmentItem["aiInsight"]>;
}) {
  return (
    <div className="space-y-2 rounded-xl bg-white p-3">
      <span className="inline-flex items-center rounded-full bg-[#E0F2FE] px-2.5 py-1 text-[11px] font-semibold text-[#075985]">
        Insights
      </span>
      {insight.title ? (
        <h4 className="text-sm font-semibold text-[#111827]">{insight.title}</h4>
      ) : null}
      <RichTextHtml
        html={insight.description}
        className="text-[12px] leading-relaxed text-[#4b5563]"
      />
      {insight.confidence > 0 ? (
        <div>
          <p className="mb-1 text-[11px] font-medium text-[#6b7280]">
            Confidence: {insight.confidence}%
          </p>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <motion.div
              className="h-full rounded-full bg-[#111827]"
              initial={{ width: 0 }}
              animate={{ width: `${insight.confidence}%` }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            />
          </div>
        </div>
      ) : null}
      {!isRichTextEmpty(insight.recommendation) ? (
        <div className="flex items-start gap-2 text-[12px] text-[#4b5563]">
          <Info className="mt-0.5 size-3.5 shrink-0 text-[#2563eb]" />
          <RichTextHtml html={insight.recommendation} />
        </div>
      ) : null}
    </div>
  );
}
