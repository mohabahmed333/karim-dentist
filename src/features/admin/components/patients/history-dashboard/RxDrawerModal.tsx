"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Prescription } from "@/services/dental_chart";
import { rxTimes, rxTiming } from "./bento-format";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prescriptions: Prescription[];
};

export function RxDrawerModal({ open, onOpenChange, prescriptions }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Prescription history</DialogTitle>
        </DialogHeader>
        <ul className="space-y-3">
          {prescriptions.map((rx) => (
            <li key={rx.id} className="rounded-2xl border border-[#e5e7eb] p-3">
              <p className="text-sm font-medium text-[#111111]">
                {rx.drugName} — {rx.dosage} x {rxTimes(rx)} daily
              </p>
              <p className="mt-1 text-xs text-[#7a7a7a]">
                {rx.startDate} → {rx.endDate} · {rx.status}
              </p>
              <p className="mt-2 text-xs text-[#111111]">
                Prescriber: Dr. Karim Elshibiny · Timing: {rxTiming(rx)}
              </p>
              <p className="mt-1 text-xs text-amber-700">
                {rx.drugName === "Amoxicillin"
                  ? "Interaction check: OK with Ibuprofen; monitor GI tolerance."
                  : "No active interaction warnings."}
              </p>
              <p className="mt-1 text-xs text-[#7a7a7a]">
                Refills: {rx.status === "ACTIVE" ? "1 remaining" : "Expired"}
              </p>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
