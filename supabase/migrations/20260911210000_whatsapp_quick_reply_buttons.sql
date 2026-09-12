-- Quick reply buttons: up to 3 reply buttons saved on a quick reply.
-- Each item is {"title": text (1-20), "title_ar": text | null}; labels are
-- validated in the app (length, uniqueness, no {{fields}}).
-- Rollback:
--   ALTER TABLE public.whatsapp_canned_replies DROP CONSTRAINT IF EXISTS whatsapp_canned_replies_buttons_shape;
--   ALTER TABLE public.whatsapp_canned_replies DROP COLUMN IF EXISTS buttons;

ALTER TABLE public.whatsapp_canned_replies
  ADD COLUMN IF NOT EXISTS buttons jsonb;

ALTER TABLE public.whatsapp_canned_replies
  DROP CONSTRAINT IF EXISTS whatsapp_canned_replies_buttons_shape;

-- CASE rather than AND: SQL doesn't promise short-circuit evaluation, and
-- jsonb_array_length raises on a non-array.
ALTER TABLE public.whatsapp_canned_replies
  ADD CONSTRAINT whatsapp_canned_replies_buttons_shape
  CHECK (
    buttons IS NULL
    OR CASE
      WHEN jsonb_typeof(buttons) = 'array' THEN jsonb_array_length(buttons) BETWEEN 1 AND 3
      ELSE false
    END
  );
