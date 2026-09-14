"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { AdminIconRail } from "./AdminIconRail";
import { AdminSidebar } from "./AdminSidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

type Props = {
  pendingCount?: number;
  permissions?: string[] | null;
};

export function AdminMobileNav({ pendingCount = 0, permissions }: Props) {
  const [open, setOpen] = useState(false);
  const t = useTranslations();

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setOpen(true)}
        aria-label={t("admin.nav.admin")}
      >
        <Menu className="size-5" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-auto max-w-none bg-[var(--admin-canvas)] lg:hidden"
        >
          <div className="flex h-full">
            <AdminIconRail permissions={permissions} />
            <div className="flex w-64 flex-col border-e border-[var(--admin-border)]">
              <div className="flex justify-end p-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  aria-label={t("admin.close")}
                >
                  <X className="size-5" />
                </Button>
              </div>
              <AdminSidebar pendingCount={pendingCount} mobile permissions={permissions} />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
