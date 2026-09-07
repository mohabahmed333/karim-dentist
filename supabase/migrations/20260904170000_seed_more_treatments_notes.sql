-- Seed more required treatments + tooth notes for demo patient Ahmed Hassan
-- Rollback: delete rows where patient_key = 'phone:+201001234567' and created via this seed
--           (matched by ai_title LIKE 'Seed ·%' / body LIKE 'Seed note ·%')

INSERT INTO public.patient_treatments (
  patient_key,
  tooth_name,
  tooth_fdi,
  severity,
  last_treatment,
  ai_title,
  ai_description,
  ai_confidence,
  ai_recommendation,
  status
)
SELECT *
FROM (
  VALUES
    (
      'phone:+201001234567',
      'Upper right central incisor',
      '11',
      'Minor',
      '<p>Composite chip repair planned.</p>',
      'Seed · Incisal edge repair',
      '<p>Small enamel fracture on the mesial-incisal edge from parafunction.</p>',
      78,
      '<p>Bonded composite restoration; night guard follow-up.</p>',
      'open'
    ),
    (
      'phone:+201001234567',
      'Upper right first premolar',
      '14',
      'Critical',
      '<p>Vitality test pending.</p>',
      'Seed · Suspected irreversible pulpitis',
      '<p>Spontaneous pain, lingering cold response. Likely needs RCT.</p>',
      91,
      '<p>Confirm with cold + percussion; schedule endodontic therapy.</p>',
      'open'
    ),
    (
      'phone:+201001234567',
      'Upper left first premolar',
      '24',
      'Minor',
      '<p></p>',
      'Seed · Occlusal caries',
      '<p>ICDAS 3 occlusal lesion on #24. No radiographic peri-apical change.</p>',
      84,
      '<p>Selective caries removal + bonded composite.</p>',
      'open'
    ),
    (
      'phone:+201001234567',
      'Upper left first molar',
      '26',
      'Minor',
      '<p>Old amalgam leaking at distal margin.</p>',
      'Seed · Failing amalgam replacement',
      '<p>Marginal ditching and secondary caries under distal amalgam.</p>',
      80,
      '<p>Remove amalgam, place bonded ceramic onlay.</p>',
      'scheduled'
    ),
    (
      'phone:+201001234567',
      'Lower left first molar',
      '36',
      'Critical',
      '<p></p>',
      'Seed · Deep distal caries',
      '<p>Deep distal caries approaching pulp horn; patient reports sweet sensitivity.</p>',
      88,
      '<p>Excavate under rubber dam; pulp cap or RCT if exposure.</p>',
      'open'
    ),
    (
      'phone:+201001234567',
      'Lower left second molar',
      '37',
      'Minor',
      '<p>Prophy last visit.</p>',
      'Seed · Buccal cervical abrasion',
      '<p>V-shaped cervical wear from aggressive brushing + acidic diet.</p>',
      72,
      '<p>Glass ionomer / composite cervical restoration; hygiene coaching.</p>',
      'open'
    ),
    (
      'phone:+201001234567',
      'Lower right first molar',
      '46',
      'Minor',
      '<p></p>',
      'Seed · Cracked tooth syndrome',
      '<p>Sharp pain on release after biting. Hairline crack on distal marginal ridge.</p>',
      86,
      '<p>Stabilize with bonded onlay; avoid hard foods meantime.</p>',
      'open'
    ),
    (
      'phone:+201001234567',
      'Lower right second molar',
      '47',
      'Minor',
      '<p></p>',
      'Seed · Distal food trap',
      '<p>Open distal contact with #48 space; gingivitis localized.</p>',
      70,
      '<p>Consider sectional matrix repair or implant consult if #48 extracted.</p>',
      'open'
    )
) AS seed(
  patient_key,
  tooth_name,
  tooth_fdi,
  severity,
  last_treatment,
  ai_title,
  ai_description,
  ai_confidence,
  ai_recommendation,
  status
)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.patient_treatments t
  WHERE t.patient_key = seed.patient_key
    AND t.ai_title = seed.ai_title
);

INSERT INTO public.patient_tooth_notes (
  patient_key,
  fdi_number,
  body,
  created_at,
  updated_at
)
SELECT
  seed.patient_key,
  seed.fdi_number,
  seed.body,
  now() - (seed.days_ago || ' days')::interval,
  now() - (seed.days_ago || ' days')::interval
FROM (
  VALUES
    (
      'phone:+201001234567',
      '11',
      '<p><strong>Seed note · #11</strong> — Incisal chip noted at recall. Patient declines immediate repair; reassess next visit.</p>',
      12
    ),
    (
      'phone:+201001234567',
      '14',
      '<p><strong>Seed note · #14</strong> — Night pain for 3 days. Cold lingers &gt;10s. Schedule endo consult.</p>',
      5
    ),
    (
      'phone:+201001234567',
      '14',
      '<p><strong>Seed note · #14 follow-up</strong> — Percussion positive. Soft tissue WNL. Discuss RCT + crown pathway.</p>',
      3
    ),
    (
      'phone:+201001234567',
      '15',
      '<p><strong>Seed note · #15</strong> — Occlusal stain in fissure; no catch with explorer. Monitor 6 months.</p>',
      20
    ),
    (
      'phone:+201001234567',
      '16',
      '<p><strong>Seed note · #16</strong> — Distal contact tight after last restoration. Floss shreds — adjust at next hygiene.</p>',
      8
    ),
    (
      'phone:+201001234567',
      '17',
      '<p><strong>Seed note · #17</strong> — Early occlusal wear facets. Mention night guard if #14 RCT proceeds.</p>',
      8
    ),
    (
      'phone:+201001234567',
      '18',
      '<p><strong>Seed note · #18</strong> — Soft tissue slightly erythematous distal. Irrigate; extract if recurrent pericoronitis.</p>',
      15
    ),
    (
      'phone:+201001234567',
      '22',
      '<p><strong>Seed note · #22</strong> — Mesial enamel chip stable. Photo on file. Bond when whitening completes.</p>',
      6
    ),
    (
      'phone:+201001234567',
      '24',
      '<p><strong>Seed note · #24</strong> — Bitewing shows enamel-limited radiolucency. Book restorative slot.</p>',
      4
    ),
    (
      'phone:+201001234567',
      '26',
      '<p><strong>Seed note · #26</strong> — Amalgam shadow + ditching. Patient prefers tooth-colored onlay.</p>',
      9
    ),
    (
      'phone:+201001234567',
      '36',
      '<p><strong>Seed note · #36</strong> — Sweet sensitivity distal. Rubber dam planned for deep excavation.</p>',
      2
    ),
    (
      'phone:+201001234567',
      '37',
      '<p><strong>Seed note · #37</strong> — Cervical abrasion mid-buccal. Advise soft brush + desensitizing paste.</p>',
      11
    ),
    (
      'phone:+201001234567',
      '46',
      '<p><strong>Seed note · #46</strong> — Crack tooth symptoms on cotton roll test. Provisional stabilization discussed.</p>',
      1
    ),
    (
      'phone:+201001234567',
      '47',
      '<p><strong>Seed note · #47</strong> — Localized distal papilla inflamed from food trap. Irrigate + reassess contacts.</p>',
      7
    )
) AS seed(patient_key, fdi_number, body, days_ago)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.patient_tooth_notes n
  WHERE n.patient_key = seed.patient_key
    AND n.body = seed.body
);
