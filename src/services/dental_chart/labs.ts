import type { LabOrder } from "./types";
import type { LabStatus } from "./enums";
import type { LabWebhookInput } from "./schemas";

const PROGRESS: Record<LabStatus, number> = {
  IMPRESSION: 15,
  FABRICATION: 83,
  SHIPPED: 95,
  DELIVERED: 100,
};

export function progressForStatus(status: LabStatus): number {
  return PROGRESS[status];
}

export function applyLabWebhook(
  order: LabOrder,
  payload: LabWebhookInput,
): LabOrder {
  if (order.id !== payload.labOrderId) return order;
  return {
    ...order,
    status: payload.status,
    progressPercent: progressForStatus(payload.status),
    updatedAt: new Date().toISOString(),
  };
}

export function labDotScale(percent: number): number[] {
  if (percent >= 100) return [4, 3, 2, 1.5];
  if (percent >= 80) return [4, 3, 2, 1.5];
  if (percent >= 40) return [3, 2, 1.5, 1];
  return [2, 1.5, 1, 1];
}
