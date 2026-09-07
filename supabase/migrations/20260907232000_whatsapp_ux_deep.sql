-- Front desk UX: media/flow/status timestamps, notes, pending status, demo seed
-- Rollback notes in comments at bottom

ALTER TABLE public.whatsapp_messages
  DROP CONSTRAINT IF EXISTS whatsapp_messages_status_check;

ALTER TABLE public.whatsapp_messages
  ADD CONSTRAINT whatsapp_messages_status_check
  CHECK (status IN ('pending', 'received', 'sent', 'delivered', 'read', 'failed'));

ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS media jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS flow jsonb;

ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS status_timestamps jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.whatsapp_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL
    REFERENCES public.whatsapp_conversations (id) ON DELETE CASCADE,
  body text NOT NULL DEFAULT '',
  pinned boolean NOT NULL DEFAULT false,
  author text NOT NULL DEFAULT 'Front desk',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS whatsapp_notes_conversation_idx
  ON public.whatsapp_notes (conversation_id, created_at DESC);

ALTER TABLE public.whatsapp_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS whatsapp_notes_admin_all ON public.whatsapp_notes;
CREATE POLICY whatsapp_notes_admin_all ON public.whatsapp_notes
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Demo conversation for pagination + media UI (stable id)
INSERT INTO public.whatsapp_conversations (
  id,
  kapso_conversation_id,
  phone_number,
  contact_name,
  status,
  last_message_at,
  last_message_preview,
  unread_count,
  metadata
) VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'demo_kapso_conv_front_desk',
  '201000000001',
  'Demo Patient (UX)',
  'active',
  now(),
  'Thanks — see you at the clinic.',
  2,
  jsonb_build_object(
    'assignees', jsonb_build_array(
      jsonb_build_object('id', 'fd', 'name', 'Front desk', 'initials', 'FD', 'avatarColor', '#DBEAFE'),
      jsonb_build_object('id', 'dk', 'name', 'Dr. Karim', 'initials', 'DK', 'avatarColor', '#DCFCE7')
    ),
    'tickets', jsonb_build_array(
      jsonb_build_object('id', 't1', 'title', 'Whitening consult follow-up', 'status', 'Not Started', 'creator', 'Front desk'),
      jsonb_build_object('id', 't2', 'title', 'Insurance pre-auth', 'status', 'In Progress', 'creator', 'Dr. Karim')
    ),
    'is_demo', true
  )
)
ON CONFLICT (id) DO UPDATE SET
  metadata = EXCLUDED.metadata,
  last_message_preview = EXCLUDED.last_message_preview,
  updated_at = now();

-- Clear prior demo messages for re-seed
DELETE FROM public.whatsapp_messages
WHERE conversation_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

DELETE FROM public.whatsapp_notes
WHERE conversation_id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

INSERT INTO public.whatsapp_notes (conversation_id, body, pinned, author)
VALUES
  ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'VIP — prefer morning slots', true, 'Front desk'),
  ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'Needs Arabic confirmations', false, 'Dr. Karim');

-- ~40 messages for infinite scroll (older → newer)
INSERT INTO public.whatsapp_messages (
  conversation_id, direction, body, message_type, status, wa_timestamp, media, flow, status_timestamps
)
SELECT
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  CASE WHEN g % 3 = 0 THEN 'outbound' ELSE 'inbound' END,
  'History message #' || g || ' — clinic scheduling thread.',
  'text',
  CASE
    WHEN g % 3 = 0 THEN 'read'
    ELSE 'received'
  END,
  now() - ((45 - g) || ' minutes')::interval,
  '[]'::jsonb,
  NULL,
  CASE
    WHEN g % 3 = 0 THEN jsonb_build_object(
      'sent_at', (now() - ((45 - g) || ' minutes')::interval)::text,
      'delivered_at', (now() - ((45 - g) || ' minutes')::interval + interval '2 seconds')::text,
      'read_at', (now() - ((45 - g) || ' minutes')::interval + interval '20 seconds')::text
    )
    ELSE '{}'::jsonb
  END
FROM generate_series(1, 32) AS g;

-- Rich media / flow samples (newest)
INSERT INTO public.whatsapp_messages (
  conversation_id, direction, body, message_type, status, wa_timestamp, media, flow, status_timestamps
) VALUES
(
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'inbound',
  'Here are photos of the area',
  'image',
  'received',
  now() - interval '8 minutes',
  jsonb_build_array(
    jsonb_build_object(
      'url', 'https://images.unsplash.com/photo-1606811841689-affb91e56306?w=800',
      'mime', 'image/jpeg',
      'name', 'tooth-1.jpg',
      'size', 245000
    ),
    jsonb_build_object(
      'url', 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800',
      'mime', 'image/jpeg',
      'name', 'tooth-2.jpg',
      'size', 198000
    )
  ),
  NULL,
  '{}'::jsonb
),
(
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'outbound',
  'Clinic tour clip',
  'video',
  'delivered',
  now() - interval '6 minutes',
  jsonb_build_array(
    jsonb_build_object(
      'url', 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      'mime', 'video/mp4',
      'name', 'clinic-tour.mp4',
      'size', 1200000
    )
  ),
  NULL,
  jsonb_build_object(
    'sent_at', (now() - interval '6 minutes')::text,
    'delivered_at', (now() - interval '5 minutes 50 seconds')::text
  )
),
(
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'inbound',
  '',
  'audio',
  'received',
  now() - interval '5 minutes',
  jsonb_build_array(
    jsonb_build_object(
      'url', 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
      'mime', 'audio/mpeg',
      'name', 'voice-note.mp3',
      'size', 48000,
      'peaks', jsonb_build_array(0.2,0.5,0.8,0.4,0.9,0.3,0.7,0.6,0.4,0.85,0.3,0.55,0.75,0.4,0.6)
    )
  ),
  NULL,
  '{}'::jsonb
),
(
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'outbound',
  'Treatment estimate PDF',
  'document',
  'read',
  now() - interval '4 minutes',
  jsonb_build_array(
    jsonb_build_object(
      'url', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      'mime', 'application/pdf',
      'name', 'estimate.pdf',
      'size', 13264
    )
  ),
  NULL,
  jsonb_build_object(
    'sent_at', (now() - interval '4 minutes')::text,
    'delivered_at', (now() - interval '3 minutes 55 seconds')::text,
    'read_at', (now() - interval '3 minutes 40 seconds')::text
  )
),
(
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'outbound',
  'Book your visit',
  'flow',
  'delivered',
  now() - interval '3 minutes',
  '[]'::jsonb,
  jsonb_build_object(
    'title', 'Appointment booking',
    'subtitle', 'Pick a service and preferred day',
    'cta', 'Open form',
    'fields', jsonb_build_array('Service', 'Preferred date', 'Phone confirm')
  ),
  jsonb_build_object(
    'sent_at', (now() - interval '3 minutes')::text,
    'delivered_at', (now() - interval '2 minutes 50 seconds')::text
  )
),
(
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'inbound',
  'Thanks — see you at the clinic.',
  'text',
  'received',
  now() - interval '1 minute',
  '[]'::jsonb,
  NULL,
  '{}'::jsonb
);

-- Rollback:
-- ALTER TABLE public.whatsapp_messages DROP COLUMN IF EXISTS media, flow, status_timestamps;
-- DROP TABLE IF EXISTS public.whatsapp_notes;
-- DELETE FROM public.whatsapp_conversations WHERE id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
