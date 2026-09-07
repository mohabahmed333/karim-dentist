"use client";

import { useMemo, useState } from "react";
import { Check, Workflow } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuickBook } from "@/features/admin/components/quick-book/QuickBookContext";
import type { SupportMessage } from "../supportDummyData";

export type FlowBookingContext = {
  conversationId: string;
  name: string;
  phone?: string;
  patientKey?: string;
};

type Props = {
  flow: NonNullable<SupportMessage["flow"]>;
  booking?: FlowBookingContext;
};

function isAppointmentFlow(flow: NonNullable<SupportMessage["flow"]>) {
  const hay = `${flow.title ?? ""} ${flow.cta ?? ""} ${flow.subtitle ?? ""}`.toLowerCase();
  return (
    hay.includes("appointment") ||
    hay.includes("booking") ||
    hay.includes("book")
  );
}

export function FlowMessageCard({ flow, booking }: Props) {
  const { openQuickBook } = useQuickBook();
  const fields = useMemo(
    () =>
      flow.fields && flow.fields.length > 0
        ? flow.fields
        : ["Service", "Preferred date", "Phone confirm"],
    [flow.fields],
  );
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f, ""])),
  );

  const appointment = isAppointmentFlow(flow) && Boolean(booking);

  function openNewAppointment() {
    if (!booking) return;
    toast.message("New appointment", {
      description: "After you save, we’ll WhatsApp the confirmation.",
    });
    openQuickBook({
      waConversationId: booking.conversationId,
      name: booking.name,
      phone: booking.phone,
      patientKey: booking.patientKey,
    });
  }

  function submit() {
    const missing = fields.filter((f) => !values[f]?.trim());
    if (missing.length) {
      toast.error(`Fill in: ${missing.join(", ")}`);
      return;
    }
    setDone(true);
    setOpen(false);
    toast.success(`${flow.title ?? "Flow"} submitted`, {
      description: fields.map((f) => `${f}: ${values[f]}`).join(" · "),
    });
  }

  return (
    <>
      <div className="mb-2 min-w-[220px] overflow-hidden rounded-xl border border-[#C7D2FE] bg-gradient-to-b from-[#EEF2FF] to-white">
        <div className="flex items-center gap-2 border-b border-[#E0E7FF] px-3 py-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#4F46E5] text-white">
            {done ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Workflow className="h-3.5 w-3.5" />
            )}
          </span>
          <div>
            <p className="text-xs font-semibold text-[#111827]">
              {flow.title ?? "WhatsApp Flow"}
            </p>
            {flow.subtitle ? (
              <p className="text-[11px] text-[#6B7280]">{flow.subtitle}</p>
            ) : null}
          </div>
        </div>
        <ul className="space-y-1 px-3 py-2">
          {fields.map((field) => (
            <li
              key={field}
              className="rounded-md bg-white/80 px-2 py-1 text-[11px] text-[#374151]"
            >
              {field}
              {done && values[field] ? (
                <span className="mt-0.5 block font-medium text-[#111827]">
                  {values[field]}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
        <div className="px-3 pb-3">
          <button
            type="button"
            onClick={() => {
              if (appointment) openNewAppointment();
              else setOpen(true);
            }}
            disabled={done}
            className="w-full rounded-md bg-[#4F46E5] px-3 py-1.5 text-xs font-semibold text-white disabled:bg-[#A5B4FC]"
          >
            {done
              ? "Submitted"
              : appointment
                ? "New appointment"
                : (flow.cta ?? "Open")}
          </button>
        </div>
      </div>

      {!appointment ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-md" showCloseButton>
            <DialogHeader>
              <DialogTitle>{flow.title ?? "WhatsApp Flow"}</DialogTitle>
              <DialogDescription>
                {flow.subtitle ?? "Complete the fields below."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-1">
              {fields.map((field) => (
                <label key={field} className="block space-y-1">
                  <span className="text-xs font-medium text-[#374151]">
                    {field}
                  </span>
                  <input
                    value={values[field] ?? ""}
                    onChange={(e) =>
                      setValues((prev) => ({
                        ...prev,
                        [field]: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#4F46E5]"
                    placeholder={field}
                  />
                </label>
              ))}
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-[#E5E7EB] px-3 py-1.5 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                className="rounded-md bg-[#4F46E5] px-3 py-1.5 text-xs font-semibold text-white"
              >
                Submit
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
