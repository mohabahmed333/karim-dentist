"use client";

import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  renderInventoryAnalyticsWidget,
  type InventoryAnalyticsWidgetRenderCtx,
} from "./renderInventoryAnalyticsWidget";

export type InventoryAnalyticsWidgetHostProps = InventoryAnalyticsWidgetRenderCtx & {
  id: string;
  className?: string;
};

export function InventoryAnalyticsWidgetHost(props: InventoryAnalyticsWidgetHostProps) {
  useTranslations();
  const { id, className, ...ctx } = props;
  const body = renderInventoryAnalyticsWidget(id, ctx);

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="min-h-0 flex-1 *:h-full *:min-h-0">{body}</div>
    </div>
  );
}
