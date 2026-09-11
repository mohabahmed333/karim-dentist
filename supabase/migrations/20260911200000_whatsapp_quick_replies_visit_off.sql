-- Switch off the sample `/visit` quick reply everywhere.
--
-- 20260911190000 originally seeded `visit` as active, and production ran that
-- version before the seed was changed to start switched off. The reply's body
-- contains {{name}} and {{next_appointment}}, and a composer without
-- fill-in support would paste those markers unfilled. Staff can turn it back on
-- in Quick replies once the new composer is live.
-- Rollback: UPDATE public.whatsapp_canned_replies SET active = true WHERE slash_key = 'visit';

UPDATE public.whatsapp_canned_replies
SET active = false,
    updated_at = now()
WHERE slash_key = 'visit'
  AND active;
