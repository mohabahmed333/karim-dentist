"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import { patientProfilePath } from "@/services/reservations/patientHistory";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PatientHistoryView } from "@/features/admin/components/patients/PatientHistoryView";
import { useAdminDrawerSide } from "@/features/admin/hooks/useAdminDrawerSide";
import { cn } from "@/lib/utils";

type Props = {
  group: PatientGroup | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PatientHistoryPanel({ group, open, onOpenChange }: Props) {
  const pathname = usePathname();
  const drawer = useAdminDrawerSide();
  const reservationsBase = pathname.startsWith("/admin/reservations")
    ? "/admin/reservations"
    : "/admin";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        dir={drawer.contentDir}
        className={cn(
          "fixed top-0 h-full max-h-full w-full max-w-lg translate-x-0 translate-y-0 overflow-y-auto rounded-none bg-white p-0 sm:max-w-lg",
          drawer.rtl
            ? "end-auto start-auto right-0 left-auto border-s border-[#e6e8ec]"
            : "end-auto start-auto left-0 right-auto border-e border-[#e6e8ec]",
        )}
      >
        {group ? (
          <>
            <DialogHeader className="border-b border-[#e6e8ec] px-5 py-4">
              <DialogTitle className="text-lg text-[#0f2744]">
                Patient history
              </DialogTitle>
              <Link
                href={patientProfilePath(group.patientKey)}
                onClick={() => onOpenChange(false)}
                className="text-sm font-medium text-[#c9a962] hover:underline"
              >
                Open full profile
              </Link>
            </DialogHeader>
            <div className="p-5">
              <PatientHistoryView
                group={group}
                reservationsBase={reservationsBase}
              />
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
