"use client";

import { useAdminDrawerSide } from "@/features/admin/hooks/useAdminDrawerSide";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function SideDrawer({ open, title, onClose, children }: Props) {
  const drawer = useAdminDrawerSide();

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetContent
        side={drawer.rtl ? "right" : "left"}
        dir={drawer.contentDir}
        showCloseButton={false}
      >
        <SheetHeader className="flex-row items-center justify-between gap-3">
          <SheetTitle className="truncate">{title}</SheetTitle>
          <SheetClose
            render={
              <button
                type="button"
                className="rounded-full bg-[var(--admin-hover,#f3f4f6)] px-3 py-1 text-sm text-[var(--admin-muted,#4b5563)]"
              />
            }
          >
            Close
          </SheetClose>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
