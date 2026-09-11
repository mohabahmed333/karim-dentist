import type { FeatureStatus } from "./FeatureReadinessList";

export type ReadinessCheck = {
  key: string;
  status: "ok" | "missing" | "unknown";
  required: boolean;
  detail: string;
};

/** What GET /api/v1/notifications/readiness returns. */
export type Readiness = {
  checks: ReadinessCheck[];
  canSend: boolean;
  blocking: string[];
  requiredTemplates: string[];
  queue: Record<string, number>;
  features?: FeatureStatus[];
};
