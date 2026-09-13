/**
 * Ratings that owe somebody a phone call.
 *
 * A low score is a job, not a statistic. The list is the work queue: who said
 * the visit went badly, what they said, and whether anyone has rung them yet.
 */

import type { createServiceClient } from "@/lib/supabase/service";

type ServiceClient = ReturnType<typeof createServiceClient>;

export type RatingRow = {
  id: string;
  rating: number;
  comment: string;
  phone: string;
  createdAt: string;
  needsCall: boolean;
  calledAt: string | null;
  conversationId: string | null;
  patientName: string;
  serviceLabel: string;
};

type Raw = {
  id: string;
  rating: number;
  comment: string;
  phone: string;
  created_at: string;
  needs_call: boolean;
  called_at: string | null;
  conversation_id: string | null;
  reservations: { patient_name: string; service_label: string } | null;
};

export function toRatingRow(raw: Raw): RatingRow {
  return {
    id: raw.id,
    rating: raw.rating,
    comment: raw.comment ?? "",
    phone: raw.phone ?? "",
    createdAt: raw.created_at,
    needsCall: raw.needs_call,
    calledAt: raw.called_at,
    conversationId: raw.conversation_id,
    patientName: raw.reservations?.patient_name ?? "",
    serviceLabel: raw.reservations?.service_label ?? "",
  };
}

export async function listVisitRatings(
  db: ServiceClient,
  opts: { onlyNeedingCall?: boolean; limit?: number } = {},
): Promise<RatingRow[]> {
  let query = db
    .from("visit_ratings")
    .select(
      "id,rating,comment,phone,created_at,needs_call,called_at,conversation_id,reservations(patient_name,service_label)",
    )
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 100);
  if (opts.onlyNeedingCall) query = query.eq("needs_call", true);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as Raw[]).map(toRatingRow);
}
