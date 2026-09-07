import type { QueueRow } from "./clinicalTypes";

export function openBalanceEgp(queue: QueueRow[]): number {
  return queue
    .filter((r) => r.status !== "done")
    .reduce((sum, r) => sum + r.feeAmount, 0);
}
