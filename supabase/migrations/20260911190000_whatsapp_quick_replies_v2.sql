-- Quick replies v2: categories, usage ranking, and one attachment per reply.
-- Rollback:
--   ALTER TABLE public.whatsapp_canned_replies
--     DROP COLUMN category, DROP COLUMN use_count, DROP COLUMN last_used_at, DROP COLUMN attachment;
--   DROP FUNCTION public.record_canned_reply_use(uuid);
--   DELETE FROM storage.buckets WHERE id = 'whatsapp-quick-replies';

ALTER TABLE public.whatsapp_canned_replies
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS use_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_used_at timestamptz,
  ADD COLUMN IF NOT EXISTS attachment jsonb;

ALTER TABLE public.whatsapp_canned_replies
  DROP CONSTRAINT IF EXISTS whatsapp_canned_replies_attachment_kind;
ALTER TABLE public.whatsapp_canned_replies
  ADD CONSTRAINT whatsapp_canned_replies_attachment_kind
  CHECK (attachment IS NULL OR attachment->>'kind' IN ('image', 'document', 'location'));

-- Invoker rights: the existing is_admin() row policy is what allows the update.
CREATE OR REPLACE FUNCTION public.record_canned_reply_use(p_id uuid)
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  UPDATE public.whatsapp_canned_replies
  SET use_count = use_count + 1,
      last_used_at = now()
  WHERE id = p_id;
$$;

GRANT EXECUTE ON FUNCTION public.record_canned_reply_use(uuid) TO authenticated;

-- Private: attachments are fetched by signed-in staff, never linked publicly.
INSERT INTO storage.buckets (id, name, public)
VALUES ('whatsapp-quick-replies', 'whatsapp-quick-replies', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS storage_admin_all_whatsapp_quick_replies ON storage.objects;
CREATE POLICY storage_admin_all_whatsapp_quick_replies ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'whatsapp-quick-replies' AND public.is_admin())
  WITH CHECK (bucket_id = 'whatsapp-quick-replies' AND public.is_admin());

UPDATE public.whatsapp_canned_replies
SET category = v.category, updated_at = now()
FROM (
  VALUES
    ('hello', 'General'),
    ('thanks', 'General'),
    ('wait', 'General'),
    ('hours', 'Clinic info'),
    ('directions', 'Clinic info'),
    ('booking', 'Booking')
) AS v(slash_key, category)
WHERE whatsapp_canned_replies.slash_key = v.slash_key
  AND whatsapp_canned_replies.category IS NULL;

-- Starts switched off so an older composer can never send its unfilled {{fields}}; staff turn it on in Quick replies.
INSERT INTO public.whatsapp_canned_replies
  (slash_key, title, title_ar, body, body_ar, category, sort_order, active)
VALUES (
  'visit',
  'Appointment reminder',
  'تذكير بالموعد',
  'Hi {{name}}, a reminder of your appointment on {{next_appointment}}. Reply here if you need to change it.',
  'أهلاً {{name}}، نذكّركم بموعدكم يوم {{next_appointment}}. ردّوا هنا إذا احتجتم لتغييره.',
  'Booking',
  55,
  false
)
ON CONFLICT (slash_key) DO NOTHING;
