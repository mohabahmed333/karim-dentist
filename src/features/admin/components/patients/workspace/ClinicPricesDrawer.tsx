"use client";

import { ChartingFeesEditor } from "@/features/admin/components/ChartingFeesEditor";
import { SideDrawer } from "../treatments/SideDrawer";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ClinicPricesDrawer({ open, onClose }: Props) {
  return (
    <SideDrawer open={open} title="Clinic prices" onClose={onClose}>
      <div className="h-full overflow-y-auto px-5 pb-8">
        <p className="mb-4 text-[12px] text-[#64748B]">
          Same menu as Settings — favorites and fees update immediately.
        </p>
        <ChartingFeesEditor />
      </div>
    </SideDrawer>
  );
}
