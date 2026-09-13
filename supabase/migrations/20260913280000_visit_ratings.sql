-- What patients say about a visit, as a number.
--
-- The assistant already classifies a follow-up reply as positive or negative,
-- which is enough to decide whether to ask for a review but not enough to run a
-- clinic by: "fine" and "excellent" are both positive, and a 2 is a phone call
-- waiting to happen. So the follow-up asks for 1-5 and the answer is kept.
--
-- One row per reply, not one per patient: a patient rates each visit, and the
-- history is the point. Keyed on the conversation and the reservation it
-- belongs to, with the phone suffix so a rating can be found the same way every
-- other patient lookup here works.
--
-- Deliberately not a view over whatsapp_ai_events: those are the assistant's
-- decisions and get pruned, while a rating is clinic data.
--
-- Rollback:
--   DROP TABLE IF EXISTS public.visit_ratings;

CREATE TABLE IF NOT EXISTS public.visit_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid
    REFERENCES public.whatsapp_conversations (id) ON DELETE CASCADE,
  reservation_id uuid REFERENCES public.reservations (id) ON DELETE SET NULL,
  message_id uuid UNIQUE
    REFERENCES public.whatsapp_messages (id) ON DELETE CASCADE,
  phone text NOT NULL DEFAULT '',
  phone_suffix text GENERATED ALWAYS AS
    (right(regexp_replace(phone, '[^0-9]', '', 'g'), 8)) STORED,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  /** The words that came with the number, when there were any. */
  comment text NOT NULL DEFAULT '',
  /**
   * A low score is a job, not a statistic. Cleared when someone has spoken to
   * the patient, so the list of people still owed a call is a query rather than
   * a memory.
   */
  needs_call boolean NOT NULL DEFAULT false,
  called_at timestamptz,
  called_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- The only two questions asked of this table: who is owed a call, and how are
-- we doing lately.
CREATE INDEX IF NOT EXISTS visit_ratings_needs_call_idx
  ON public.visit_ratings (created_at DESC)
  WHERE needs_call;
CREATE INDEX IF NOT EXISTS visit_ratings_recent_idx
  ON public.visit_ratings (created_at DESC);

ALTER TABLE public.visit_ratings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS visit_ratings_admin_all ON public.visit_ratings;
CREATE POLICY visit_ratings_admin_all ON public.visit_ratings
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Where the clinic wants happy patients sent. Distinct from contact_map_url,
-- which is a map link and lives in the LLM-writable CMS singleton — a review
-- destination should not be editable by a model.
ALTER TABLE public.patient_notification_settings
  ADD COLUMN IF NOT EXISTS review_url text NOT NULL DEFAULT '';
