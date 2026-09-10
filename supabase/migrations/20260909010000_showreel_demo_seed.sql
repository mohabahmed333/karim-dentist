-- Showreel / LinkedIn demo seed: WhatsApp threads, patients, reservations, slots
-- Rollback:
--   DELETE FROM public.whatsapp_messages WHERE conversation_id IN (
--     SELECT id FROM public.whatsapp_conversations WHERE metadata->>'is_demo' = 'true');
--   DELETE FROM public.whatsapp_notes WHERE conversation_id IN (
--     SELECT id FROM public.whatsapp_conversations WHERE metadata->>'is_demo' = 'true');
--   DELETE FROM public.whatsapp_conversations WHERE metadata->>'is_demo' = 'true';
--   DELETE FROM public.reservations WHERE notes LIKE '[demo-showreel]%';
--   DELETE FROM public.patient_profiles WHERE patient_key LIKE 'phone:+20111%';
--   DELETE FROM public.appointment_slots WHERE reservation_id IS NULL
--     AND starts_at > now() AND starts_at < now() + interval '14 days'
--     AND notes IS NULL; -- slots have no notes; skip or regenerate via clinic schedule

-- Stable demo conversation ids (10 threads)
-- c1 Sara whitening (unread just-arrived) … c10 archived follow-up

DELETE FROM public.whatsapp_messages
WHERE conversation_id IN (
  SELECT id FROM public.whatsapp_conversations
  WHERE (metadata->>'is_demo') = 'true'
);

DELETE FROM public.whatsapp_notes
WHERE conversation_id IN (
  SELECT id FROM public.whatsapp_conversations
  WHERE (metadata->>'is_demo') = 'true'
);

DELETE FROM public.whatsapp_conversations
WHERE (metadata->>'is_demo') = 'true';

INSERT INTO public.whatsapp_conversations (
  id, kapso_conversation_id, phone_number, contact_name, patient_key, status,
  last_message_at, last_message_preview, last_message_type, last_message_status,
  last_inbound_at, unread_count, metadata
) VALUES
(
  'a1111111-1111-4111-8111-111111111101',
  'demo_showreel_sara',
  '201111000001',
  'Sara Hassan',
  'phone:+201111000001',
  'active',
  now() - interval '40 seconds',
  'Can I book teeth whitening this week?',
  'text',
  'received',
  now() - interval '40 seconds',
  1,
  jsonb_build_object('is_demo', true, 'vip', true, 'lang', 'en', 'tickets', jsonb_build_array(
    jsonb_build_object('id','t-sara','title','Whitening consult','status','Not Started','creator','Front desk')
  ))
),
(
  'a1111111-1111-4111-8111-111111111102',
  'demo_showreel_omar',
  '201111000002',
  'Omar Farid',
  'phone:+201111000002',
  'active',
  now() - interval '12 minutes',
  'Thanks — Tuesday 10:30 works.',
  'text',
  'read',
  now() - interval '25 minutes',
  0,
  jsonb_build_object('is_demo', true, 'lang', 'en')
),
(
  'a1111111-1111-4111-8111-111111111103',
  'demo_showreel_nour',
  '201111000003',
  'Nour El-Sayed',
  'phone:+201111000003',
  'active',
  now() - interval '8 minutes',
  'Here are photos of the sore tooth',
  'image',
  'received',
  now() - interval '8 minutes',
  2,
  jsonb_build_object('is_demo', true, 'lang', 'en', 'prefer_morning', true)
),
(
  'a1111111-1111-4111-8111-111111111104',
  'demo_showreel_youssef',
  '201111000004',
  'Youssef Adel',
  'phone:+201111000004',
  'active',
  now() - interval '18 minutes',
  'Voice note about sensitivity',
  'audio',
  'received',
  now() - interval '18 minutes',
  1,
  jsonb_build_object('is_demo', true, 'lang', 'en')
),
(
  'a1111111-1111-4111-8111-111111111105',
  'demo_showreel_mariam',
  '201111000005',
  'Mariam Khaled',
  'phone:+201111000005',
  'active',
  now() - interval '35 minutes',
  'Estimate PDF attached',
  'document',
  'read',
  now() - interval '55 minutes',
  0,
  jsonb_build_object('is_demo', true, 'lang', 'en', 'vip', true)
),
(
  'a1111111-1111-4111-8111-111111111106',
  'demo_showreel_ahmed_ar',
  '201111000006',
  'أحمد محمود',
  'phone:+201111000006',
  'active',
  now() - interval '6 minutes',
  'تم تأكيد موعدك غداً الساعة ١١',
  'text',
  'delivered',
  now() - interval '22 minutes',
  0,
  jsonb_build_object('is_demo', true, 'lang', 'ar', 'arabic_confirmations', true)
),
(
  'a1111111-1111-4111-8111-111111111107',
  'demo_showreel_layla',
  '201111000007',
  'Layla Ibrahim',
  'phone:+201111000007',
  'active',
  now() - interval '50 minutes',
  'Book your visit',
  'interactive',
  'delivered',
  now() - interval '70 minutes',
  0,
  jsonb_build_object('is_demo', true, 'lang', 'en')
),
(
  'a1111111-1111-4111-8111-111111111108',
  'demo_showreel_karim',
  '201111000008',
  'Karim Saleh',
  'phone:+201111000008',
  'active',
  now() - interval '2 hours',
  'Clinic location pin',
  'location',
  'read',
  now() - interval '3 hours',
  0,
  jsonb_build_object('is_demo', true, 'lang', 'en')
),
(
  'a1111111-1111-4111-8111-111111111109',
  'demo_showreel_hana',
  '201111000009',
  'Hana Mostafa',
  'phone:+201111000009',
  'ended',
  now() - interval '1 day',
  'See you at the follow-up.',
  'text',
  'read',
  now() - interval '1 day',
  0,
  jsonb_build_object('is_demo', true, 'lang', 'en')
),
(
  'a1111111-1111-4111-8111-11111111110a',
  'demo_showreel_archived',
  '201111000010',
  'Rami Nabil',
  'phone:+201111000010',
  'archived',
  now() - interval '5 days',
  'Case closed — thanks!',
  'text',
  'read',
  now() - interval '5 days',
  0,
  jsonb_build_object('is_demo', true, 'lang', 'en')
),
-- keep original deep-seed id as an 11th demo thread (rich media history)
(
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'demo_kapso_conv_front_desk',
  '201000000001',
  'Demo Patient (UX)',
  'phone:+201000000001',
  'active',
  now() - interval '2 minutes',
  'Thanks — see you at the clinic.',
  'text',
  'read',
  now() - interval '5 minutes',
  0,
  jsonb_build_object('is_demo', true, 'lang', 'en', 'tickets', jsonb_build_array(
    jsonb_build_object('id','t1','title','Whitening consult follow-up','status','Not Started','creator','Front desk')
  ))
)
ON CONFLICT (id) DO UPDATE SET
  kapso_conversation_id = EXCLUDED.kapso_conversation_id,
  phone_number = EXCLUDED.phone_number,
  contact_name = EXCLUDED.contact_name,
  patient_key = EXCLUDED.patient_key,
  status = EXCLUDED.status,
  last_message_at = EXCLUDED.last_message_at,
  last_message_preview = EXCLUDED.last_message_preview,
  last_message_type = EXCLUDED.last_message_type,
  last_message_status = EXCLUDED.last_message_status,
  last_inbound_at = EXCLUDED.last_inbound_at,
  unread_count = EXCLUDED.unread_count,
  metadata = EXCLUDED.metadata,
  updated_at = now();

INSERT INTO public.whatsapp_notes (conversation_id, body, pinned, author) VALUES
  ('a1111111-1111-4111-8111-111111111101', 'VIP — prefer morning whitening slots', true, 'Front desk'),
  ('a1111111-1111-4111-8111-111111111101', 'Showreel unread inbound used for recording', false, 'Demo'),
  ('a1111111-1111-4111-8111-111111111103', 'Pain photos received — route to charting', true, 'Dr. Karim'),
  ('a1111111-1111-4111-8111-111111111106', 'Needs Arabic confirmations', true, 'Front desk'),
  ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'VIP — prefer morning slots', true, 'Front desk'),
  ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'Needs Arabic confirmations', false, 'Dr. Karim');

-- Sara: whitening inquiry (unread tip)
INSERT INTO public.whatsapp_messages (
  conversation_id, kapso_wamid, direction, body, message_type, status, wa_timestamp, media, flow, status_timestamps, reply_to
) VALUES
('a1111111-1111-4111-8111-111111111101', 'demo_wamid_sara_01', 'inbound', 'Hi Dental Lounge — do you offer professional whitening?', 'text', 'received', now() - interval '3 hours', '[]'::jsonb, NULL, '{}'::jsonb, NULL),
('a1111111-1111-4111-8111-111111111101', 'demo_wamid_sara_02', 'outbound', 'Welcome Sara! Yes — in-chair whitening and take-home kits. Would you like a consult?', 'text', 'read', now() - interval '2 hours 50 minutes', '[]'::jsonb, NULL,
  jsonb_build_object('sent_at', (now()-interval '2 hours 50 minutes')::text, 'delivered_at', (now()-interval '2 hours 49 minutes')::text, 'read_at', (now()-interval '2 hours 48 minutes')::text), NULL),
('a1111111-1111-4111-8111-111111111101', 'demo_wamid_sara_03', 'inbound', 'In-chair please. Any openings this week?', 'text', 'received', now() - interval '2 hours', '[]'::jsonb, NULL, '{}'::jsonb, NULL),
('a1111111-1111-4111-8111-111111111101', 'demo_wamid_sara_04', 'outbound', 'We have Tue 10:30, Wed 14:00, Thu 11:00.', 'text', 'delivered', now() - interval '1 hour 50 minutes', '[]'::jsonb, NULL,
  jsonb_build_object('sent_at', (now()-interval '1 hour 50 minutes')::text, 'delivered_at', (now()-interval '1 hour 49 minutes')::text), NULL),
('a1111111-1111-4111-8111-111111111101', 'demo_wamid_sara_05', 'inbound', 'Can I book teeth whitening this week?', 'text', 'received', now() - interval '40 seconds', '[]'::jsonb, NULL, '{}'::jsonb, NULL);

-- Omar: confirm / reschedule
INSERT INTO public.whatsapp_messages (
  conversation_id, kapso_wamid, direction, body, message_type, status, wa_timestamp, media, flow, status_timestamps, reply_to
) VALUES
('a1111111-1111-4111-8111-111111111102', 'demo_wamid_omar_01', 'outbound', 'Reminder: cleaning tomorrow at 09:00. Reply RESCHEDULE to change.', 'text', 'read', now() - interval '5 hours', '[]'::jsonb, NULL,
  jsonb_build_object('sent_at', (now()-interval '5 hours')::text, 'delivered_at', (now()-interval '4 hours 59 minutes')::text, 'read_at', (now()-interval '4 hours 50 minutes')::text), NULL),
('a1111111-1111-4111-8111-111111111102', 'demo_wamid_omar_02', 'inbound', 'RESCHEDULE please — morning conflict', 'text', 'received', now() - interval '4 hours', '[]'::jsonb, NULL, '{}'::jsonb, NULL),
('a1111111-1111-4111-8111-111111111102', 'demo_wamid_omar_03', 'outbound', 'Got it. Open slots: Tue 10:30 or Wed 16:00.', 'text', 'read', now() - interval '3 hours 40 minutes', '[]'::jsonb, NULL,
  jsonb_build_object('sent_at', (now()-interval '3 hours 40 minutes')::text, 'delivered_at', (now()-interval '3 hours 39 minutes')::text, 'read_at', (now()-interval '3 hours 30 minutes')::text), NULL),
('a1111111-1111-4111-8111-111111111102', 'demo_wamid_omar_04', 'inbound', 'Tuesday 10:30 please', 'text', 'received', now() - interval '25 minutes', '[]'::jsonb, NULL, '{}'::jsonb,
  jsonb_build_object('wamid', 'demo_wamid_omar_03', 'authorName', 'Front desk', 'body', 'Got it. Open slots: Tue 10:30 or Wed 16:00.', 'messageType', 'text')),
('a1111111-1111-4111-8111-111111111102', 'demo_wamid_omar_05', 'outbound', 'Thanks — Tuesday 10:30 works. Confirmed.', 'text', 'read', now() - interval '12 minutes', '[]'::jsonb, NULL,
  jsonb_build_object('sent_at', (now()-interval '12 minutes')::text, 'delivered_at', (now()-interval '11 minutes')::text, 'read_at', (now()-interval '10 minutes')::text), NULL);

-- Nour: photos
INSERT INTO public.whatsapp_messages (
  conversation_id, kapso_wamid, direction, body, message_type, status, wa_timestamp, media, flow, status_timestamps, reply_to
) VALUES
('a1111111-1111-4111-8111-111111111103', 'demo_wamid_nour_01', 'inbound', 'Upper right molar hurts when I bite', 'text', 'received', now() - interval '2 hours', '[]'::jsonb, NULL, '{}'::jsonb, NULL),
('a1111111-1111-4111-8111-111111111103', 'demo_wamid_nour_02', 'outbound', 'Sorry to hear that. Can you send a clear photo of the area?', 'text', 'read', now() - interval '1 hour 50 minutes', '[]'::jsonb, NULL,
  jsonb_build_object('sent_at', (now()-interval '1 hour 50 minutes')::text, 'delivered_at', (now()-interval '1 hour 49 minutes')::text, 'read_at', (now()-interval '1 hour 45 minutes')::text), NULL),
('a1111111-1111-4111-8111-111111111103', 'demo_wamid_nour_03', 'inbound', 'Here are photos of the sore tooth', 'image', 'received', now() - interval '8 minutes',
  jsonb_build_array(
    jsonb_build_object('url','https://images.unsplash.com/photo-1606811841689-affb91e56306?w=800','mime','image/jpeg','name','tooth-1.jpg','size',245000),
    jsonb_build_object('url','https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800','mime','image/jpeg','name','tooth-2.jpg','size',198000)
  ), NULL, '{}'::jsonb, NULL),
('a1111111-1111-4111-8111-111111111103', 'demo_wamid_nour_04', 'inbound', 'Also a close-up', 'image', 'received', now() - interval '7 minutes',
  jsonb_build_array(jsonb_build_object('url','https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=800','mime','image/jpeg','name','closeup.jpg','size',180000)),
  NULL, '{}'::jsonb, NULL);

-- Youssef: voice
INSERT INTO public.whatsapp_messages (
  conversation_id, kapso_wamid, direction, body, message_type, status, wa_timestamp, media, flow, status_timestamps, reply_to
) VALUES
('a1111111-1111-4111-8111-111111111104', 'demo_wamid_you_01', 'outbound', 'How is the sensitivity after last visit?', 'text', 'read', now() - interval '1 day', '[]'::jsonb, NULL,
  jsonb_build_object('sent_at', (now()-interval '1 day')::text, 'delivered_at', (now()-interval '1 day' + interval '5 seconds')::text, 'read_at', (now()-interval '23 hours')::text), NULL),
('a1111111-1111-4111-8111-111111111104', 'demo_wamid_you_02', 'inbound', 'Voice note about sensitivity', 'audio', 'received', now() - interval '18 minutes',
  jsonb_build_array(jsonb_build_object(
    'url','https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3','mime','audio/mpeg','name','voice-note.mp3','size',48000,
    'peaks', jsonb_build_array(0.2,0.5,0.8,0.4,0.9,0.3,0.7,0.6,0.4,0.85,0.3,0.55)
  )), NULL, '{}'::jsonb, NULL),
('a1111111-1111-4111-8111-111111111104', 'demo_wamid_you_03', 'outbound', 'Received — we will review and propose a desensitizing plan.', 'text', 'delivered', now() - interval '10 minutes', '[]'::jsonb, NULL,
  jsonb_build_object('sent_at', (now()-interval '10 minutes')::text, 'delivered_at', (now()-interval '9 minutes')::text), NULL);

-- Mariam: estimate PDF + video
INSERT INTO public.whatsapp_messages (
  conversation_id, kapso_wamid, direction, body, message_type, status, wa_timestamp, media, flow, status_timestamps, reply_to
) VALUES
('a1111111-1111-4111-8111-111111111105', 'demo_wamid_mar_01', 'inbound', 'Can you send the implant estimate again?', 'text', 'received', now() - interval '2 hours', '[]'::jsonb, NULL, '{}'::jsonb, NULL),
('a1111111-1111-4111-8111-111111111105', 'demo_wamid_mar_02', 'outbound', 'Clinic tour clip', 'video', 'delivered', now() - interval '90 minutes',
  jsonb_build_array(jsonb_build_object('url','https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4','mime','video/mp4','name','clinic-tour.mp4','size',1200000)),
  NULL, jsonb_build_object('sent_at', (now()-interval '90 minutes')::text, 'delivered_at', (now()-interval '89 minutes')::text), NULL),
('a1111111-1111-4111-8111-111111111105', 'demo_wamid_mar_03', 'outbound', 'Estimate PDF attached', 'document', 'read', now() - interval '35 minutes',
  jsonb_build_array(jsonb_build_object('url','https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf','mime','application/pdf','name','estimate.pdf','size',13264)),
  NULL, jsonb_build_object('sent_at', (now()-interval '35 minutes')::text, 'delivered_at', (now()-interval '34 minutes')::text, 'read_at', (now()-interval '30 minutes')::text), NULL);

-- Ahmed Arabic thread
INSERT INTO public.whatsapp_messages (
  conversation_id, kapso_wamid, direction, body, message_type, status, wa_timestamp, media, flow, status_timestamps, reply_to
) VALUES
('a1111111-1111-4111-8111-111111111106', 'demo_wamid_ah_01', 'inbound', 'مرحبا، أريد حجز كشف أسنان', 'text', 'received', now() - interval '3 hours', '[]'::jsonb, NULL, '{}'::jsonb, NULL),
('a1111111-1111-4111-8111-111111111106', 'demo_wamid_ah_02', 'outbound', 'أهلاً أحمد! متاح غداً الساعة ١١ أو بعد غد الساعة ٤', 'text', 'read', now() - interval '2 hours 50 minutes', '[]'::jsonb, NULL,
  jsonb_build_object('sent_at', (now()-interval '2 hours 50 minutes')::text, 'delivered_at', (now()-interval '2 hours 49 minutes')::text, 'read_at', (now()-interval '2 hours 40 minutes')::text), NULL),
('a1111111-1111-4111-8111-111111111106', 'demo_wamid_ah_03', 'inbound', 'غداً الساعة ١١ من فضلك', 'text', 'received', now() - interval '22 minutes', '[]'::jsonb, NULL, '{}'::jsonb, NULL),
('a1111111-1111-4111-8111-111111111106', 'demo_wamid_ah_04', 'outbound', 'تم تأكيد موعدك غداً الساعة ١١', 'text', 'delivered', now() - interval '6 minutes', '[]'::jsonb, NULL,
  jsonb_build_object('sent_at', (now()-interval '6 minutes')::text, 'delivered_at', (now()-interval '5 minutes')::text), NULL);

-- Layla: interactive booking CTA
INSERT INTO public.whatsapp_messages (
  conversation_id, kapso_wamid, direction, body, message_type, status, wa_timestamp, media, flow, status_timestamps, reply_to
) VALUES
('a1111111-1111-4111-8111-111111111107', 'demo_wamid_lay_01', 'inbound', 'How do I book from WhatsApp?', 'text', 'received', now() - interval '2 hours', '[]'::jsonb, NULL, '{}'::jsonb, NULL),
('a1111111-1111-4111-8111-111111111107', 'demo_wamid_lay_02', 'outbound', 'Book your visit', 'interactive', 'delivered', now() - interval '50 minutes', '[]'::jsonb,
  jsonb_build_object('kind','buttons','title','Appointment booking','subtitle','Pick a service','cta','Open form',
    'buttons', jsonb_build_array(
      jsonb_build_object('id','whitening','title','Whitening'),
      jsonb_build_object('id','consult','title','Consultation'),
      jsonb_build_object('id','cleaning','title','Cleaning')
    )),
  jsonb_build_object('sent_at', (now()-interval '50 minutes')::text, 'delivered_at', (now()-interval '49 minutes')::text), NULL),
('a1111111-1111-4111-8111-111111111107', 'demo_wamid_lay_03', 'outbound', 'Or open the booking form', 'flow', 'sent', now() - interval '48 minutes', '[]'::jsonb,
  jsonb_build_object('kind','flow','title','Appointment booking','subtitle','Preferred day + phone','cta','Open form','fields', jsonb_build_array('Service','Preferred date','Phone confirm')),
  jsonb_build_object('sent_at', (now()-interval '48 minutes')::text), NULL);

-- Karim: location
INSERT INTO public.whatsapp_messages (
  conversation_id, kapso_wamid, direction, body, message_type, status, wa_timestamp, media, flow, status_timestamps, reply_to
) VALUES
('a1111111-1111-4111-8111-111111111108', 'demo_wamid_kar_01', 'inbound', 'Where is the clinic?', 'text', 'received', now() - interval '4 hours', '[]'::jsonb, NULL, '{}'::jsonb, NULL),
('a1111111-1111-4111-8111-111111111108', 'demo_wamid_kar_02', 'outbound', 'Clinic location pin', 'location', 'read', now() - interval '2 hours', '[]'::jsonb,
  jsonb_build_object('kind','location','latitude',30.0444,'longitude',31.2357,'address','Dental Lounge — Cairo','title','Dental Lounge'),
  jsonb_build_object('sent_at', (now()-interval '2 hours')::text, 'delivered_at', (now()-interval '1 hour 59 minutes')::text, 'read_at', (now()-interval '1 hour 50 minutes')::text), NULL);

-- Hana ended + Rami archived short threads
INSERT INTO public.whatsapp_messages (
  conversation_id, kapso_wamid, direction, body, message_type, status, wa_timestamp, media, flow, status_timestamps, reply_to
) VALUES
('a1111111-1111-4111-8111-111111111109', 'demo_wamid_han_01', 'inbound', 'Follow-up went well, thank you', 'text', 'received', now() - interval '1 day 2 hours', '[]'::jsonb, NULL, '{}'::jsonb, NULL),
('a1111111-1111-4111-8111-111111111109', 'demo_wamid_han_02', 'outbound', 'See you at the follow-up.', 'text', 'read', now() - interval '1 day', '[]'::jsonb, NULL,
  jsonb_build_object('sent_at', (now()-interval '1 day')::text, 'delivered_at', (now()-interval '1 day' + interval '3 seconds')::text, 'read_at', (now()-interval '23 hours')::text), NULL),
('a1111111-1111-4111-8111-11111111110a', 'demo_wamid_ram_01', 'inbound', 'All set — closing this chat', 'text', 'received', now() - interval '5 days 1 hour', '[]'::jsonb, NULL, '{}'::jsonb, NULL),
('a1111111-1111-4111-8111-11111111110a', 'demo_wamid_ram_02', 'outbound', 'Case closed — thanks!', 'text', 'read', now() - interval '5 days', '[]'::jsonb, NULL,
  jsonb_build_object('sent_at', (now()-interval '5 days')::text, 'delivered_at', (now()-interval '5 days' + interval '2 seconds')::text, 'read_at', (now()-interval '4 days 20 hours')::text), NULL);

-- Bulk filler for deep-seed conversation (realistic dental lines, not History #N)
INSERT INTO public.whatsapp_messages (
  conversation_id, kapso_wamid, direction, body, message_type, status, wa_timestamp, media, flow, status_timestamps
)
SELECT
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'demo_wamid_bulk_' || g,
  CASE WHEN g % 3 = 0 THEN 'outbound' ELSE 'inbound' END,
  CASE (g % 8)
    WHEN 0 THEN 'Is laser whitening safe for sensitive teeth?'
    WHEN 1 THEN 'We can assess sensitivity first, then choose a gentle protocol.'
    WHEN 2 THEN 'What documents should I bring?'
    WHEN 3 THEN 'ID + any prior X-rays if you have them.'
    WHEN 4 THEN 'Parking tip near the clinic?'
    WHEN 5 THEN 'Street parking on the north side; call if you get lost.'
    WHEN 6 THEN 'Can kids visit with me?'
    ELSE 'Of course — we have a family waiting area.'
  END,
  'text',
  CASE WHEN g % 3 = 0 THEN 'read' ELSE 'received' END,
  now() - ((90 - g) || ' minutes')::interval,
  '[]'::jsonb,
  NULL,
  CASE WHEN g % 3 = 0 THEN jsonb_build_object(
    'sent_at', (now() - ((90 - g) || ' minutes')::interval)::text,
    'delivered_at', (now() - ((90 - g) || ' minutes')::interval + interval '2 seconds')::text,
    'read_at', (now() - ((90 - g) || ' minutes')::interval + interval '20 seconds')::text
  ) ELSE '{}'::jsonb END
FROM generate_series(1, 48) AS g;

-- Rich media samples on deep-seed thread
INSERT INTO public.whatsapp_messages (
  conversation_id, kapso_wamid, direction, body, message_type, status, wa_timestamp, media, flow, status_timestamps
) VALUES
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'demo_wamid_deep_img', 'inbound', 'Here are photos of the area', 'image', 'received', now() - interval '8 minutes',
  jsonb_build_array(
    jsonb_build_object('url','https://images.unsplash.com/photo-1606811841689-affb91e56306?w=800','mime','image/jpeg','name','tooth-1.jpg','size',245000)
  ), NULL, '{}'::jsonb),
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'demo_wamid_deep_end', 'outbound', 'Thanks — see you at the clinic.', 'text', 'read', now() - interval '2 minutes', '[]'::jsonb, NULL,
  jsonb_build_object('sent_at', (now()-interval '2 minutes')::text, 'delivered_at', (now()-interval '1 minute 50 seconds')::text, 'read_at', (now()-interval '1 minute')::text));

-- Patient profiles for demo phones
INSERT INTO public.patient_profiles (
  patient_key, display_name, phone, email, gender, notes
) VALUES
('phone:+201111000001', 'Sara Hassan', '+201111000001', 'sara.demo@example.com', 'female', '[demo-showreel] VIP whitening'),
('phone:+201111000002', 'Omar Farid', '+201111000002', 'omar.demo@example.com', 'male', '[demo-showreel] Reschedule cleaning'),
('phone:+201111000003', 'Nour El-Sayed', '+201111000003', NULL, 'female', '[demo-showreel] Pain photos'),
('phone:+201111000004', 'Youssef Adel', '+201111000004', NULL, 'male', '[demo-showreel] Sensitivity'),
('phone:+201111000005', 'Mariam Khaled', '+201111000005', 'mariam.demo@example.com', 'female', '[demo-showreel] Implant estimate'),
('phone:+201111000006', 'أحمد محمود', '+201111000006', NULL, 'male', '[demo-showreel] Arabic confirmations'),
('phone:+201111000007', 'Layla Ibrahim', '+201111000007', NULL, 'female', '[demo-showreel] Booking CTA'),
('phone:+201111000008', 'Karim Saleh', '+201111000008', NULL, 'male', '[demo-showreel] Location'),
('phone:+201111000009', 'Hana Mostafa', '+201111000009', NULL, 'female', '[demo-showreel] Follow-up done'),
('phone:+201111000010', 'Rami Nabil', '+201111000010', NULL, 'male', '[demo-showreel] Archived'),
('phone:+201000000001', 'Demo Patient (UX)', '+201000000001', NULL, 'prefer_not', '[demo-showreel] Deep seed')
ON CONFLICT (patient_key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  notes = EXCLUDED.notes,
  updated_at = now();

-- Demo reservations (tagged in notes)
DELETE FROM public.reservations WHERE notes LIKE '[demo-showreel]%';

INSERT INTO public.reservations (
  patient_name, phone, email, service_label, starts_at, notes, status
) VALUES
('Sara Hassan', '+201111000001', 'sara.demo@example.com', 'Teeth whitening',
  date_trunc('day', now()) + interval '1 day' + interval '10 hours 30 minutes',
  '[demo-showreel] Pending whitening', 'pending'),
('Omar Farid', '+201111000002', 'omar.demo@example.com', 'Cleaning',
  date_trunc('day', now()) + interval '1 day' + interval '10 hours 30 minutes',
  '[demo-showreel] Confirmed after reschedule', 'confirmed'),
('Nour El-Sayed', '+201111000003', NULL, 'General consultation',
  date_trunc('day', now()) + interval '11 hours',
  '[demo-showreel] Today consult', 'confirmed'),
('Youssef Adel', '+201111000004', NULL, 'General consultation',
  date_trunc('day', now()) + interval '14 hours',
  '[demo-showreel] Sensitivity review', 'pending'),
('Mariam Khaled', '+201111000005', 'mariam.demo@example.com', 'Dental implants',
  date_trunc('day', now()) + interval '2 days' + interval '15 hours',
  '[demo-showreel] Implant plan', 'confirmed'),
('أحمد محمود', '+201111000006', NULL, 'General consultation',
  date_trunc('day', now()) + interval '1 day' + interval '11 hours',
  '[demo-showreel] Arabic booking', 'confirmed'),
('Layla Ibrahim', '+201111000007', NULL, 'Teeth whitening',
  date_trunc('day', now()) + interval '3 days' + interval '12 hours',
  '[demo-showreel] CTA booking', 'pending'),
('Hana Mostafa', '+201111000009', NULL, 'General consultation',
  date_trunc('day', now()) - interval '1 day' + interval '10 hours',
  '[demo-showreel] Completed visit', 'completed'),
('Rami Nabil', '+201111000010', NULL, 'Cleaning',
  date_trunc('day', now()) - interval '3 days' + interval '11 hours',
  '[demo-showreel] Cancelled', 'cancelled'),
('Karim Saleh', '+201111000008', NULL, 'Cleaning',
  date_trunc('day', now()) - interval '2 hours',
  '[demo-showreel] No-show today', 'no_show'),
('Demo Patient (UX)', '+201000000001', NULL, 'Teeth whitening',
  date_trunc('day', now()) + interval '4 days' + interval '16 hours',
  '[demo-showreel] Deep seed booking', 'pending');

-- Open slots for AI booking demos (next 7 weekdays mornings)
INSERT INTO public.appointment_slots (starts_at, ends_at, status)
SELECT
  (date_trunc('day', now()) + (d || ' days')::interval + interval '10 hours 30 minutes'),
  (date_trunc('day', now()) + (d || ' days')::interval + interval '11 hours 30 minutes'),
  'open'
FROM generate_series(1, 7) AS d
WHERE EXTRACT(ISODOW FROM date_trunc('day', now()) + (d || ' days')::interval) < 6
ON CONFLICT DO NOTHING;

INSERT INTO public.appointment_slots (starts_at, ends_at, status)
SELECT
  (date_trunc('day', now()) + (d || ' days')::interval + interval '14 hours'),
  (date_trunc('day', now()) + (d || ' days')::interval + interval '15 hours'),
  'open'
FROM generate_series(1, 7) AS d
WHERE EXTRACT(ISODOW FROM date_trunc('day', now()) + (d || ' days')::interval) < 6
ON CONFLICT DO NOTHING;
