-- Two service kinds + Arabic titles; seed clinic menus from flyers
-- Rollback: soft-delete seeded rows; DROP COLUMN kind, title_ar, description_ar;

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'our_services'
    CHECK (kind IN ('our_services', 'laser')),
  ADD COLUMN IF NOT EXISTS title_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description_ar text NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS services_kind_sort_idx
  ON public.services (kind, sort_order)
  WHERE deleted_at IS NULL;

UPDATE public.services
SET deleted_at = coalesce(deleted_at, now()), updated_at = now()
WHERE deleted_at IS NULL;

INSERT INTO public.services (
  title, title_ar, description, description_ar, kind, tags, sort_order, is_published
) VALUES
  ('Dental laser treatments', 'علاجات الليزر للأسنان', 'Advanced diode laser care for soft tissue and beyond.', '', 'our_services', ARRAY['Laser'], 1, true),
  ('Surgical extractions and surgical treatments', 'خلع جراحي وعلاجات جراحية', 'Precise surgical extraction and oral surgery care.', '', 'our_services', ARRAY['Surgery'], 2, true),
  ('Crowns and veneers', 'تيجان وفينير', 'Restore strength and aesthetics with crowns and veneers.', '', 'our_services', ARRAY['Restorative'], 3, true),
  ('Removable prosthesis', 'تركيبات متحركه', 'Comfortable removable prosthetic solutions.', '', 'our_services', ARRAY['Prosthesis'], 4, true),
  ('Orthodontic treatment (Braces)', 'تقويم الأسنان', 'Traditional braces for aligned, healthy smiles.', '', 'our_services', ARRAY['Ortho'], 5, true),
  ('Aligners', 'تقويم شفاف', 'Clear aligner orthodontics.', '', 'our_services', ARRAY['Ortho'], 6, true),
  ('Pediatric dentistry', 'طب أسنان الأطفال', 'Gentle dentistry for children.', '', 'our_services', ARRAY['Pedo'], 7, true),
  ('Periodontic treatment', 'علاج اللثة', 'Gum health and periodontal therapy.', '', 'our_services', ARRAY['Perio'], 8, true),
  ('Dental implants', 'زراعة الأسنان', 'Replace missing teeth with implants.', '', 'our_services', ARRAY['Implants'], 9, true),
  ('Endodontic treatment', 'علاج جذور الأسنان', 'Root canal therapy for adults.', '', 'our_services', ARRAY['Endo'], 10, true),
  ('Teeth whitening', 'تبييض الأسنان', 'Professional whitening for a brighter smile.', '', 'our_services', ARRAY['Cosmetic'], 11, true),
  ('Gingivectomy', 'استئصال اللثة', 'Removes excess gum tissue and reshapes the gum line.', 'يزيل أنسجة اللثة الزائدة ويعيد تشكيل خط اللثة.', 'laser', ARRAY['Soft tissue'], 20, true),
  ('Gingival Depigmentation', 'إزالة تصبغ اللثة', 'Lightens dark gums for a natural pink color.', 'يفتح اللثة الداكنة ويستعيد اللون الوردي الطبيعي.', 'laser', ARRAY['Cosmetic'], 21, true),
  ('Oral Ulcer Removal', 'إزالة قرح الفم', 'Relieves pain and promotes faster healing of mouth ulcers.', 'يخفف الألم ويساعد على شفاء قرح الفم بسرعة.', 'laser', ARRAY['Soft tissue'], 22, true),
  ('Frenectomy', 'قطع اللجام', 'Releases abnormal frenum attachments comfortably.', 'يحرر التصاقات اللجام غير الطبيعية براحة.', 'laser', ARRAY['Soft tissue'], 23, true),
  ('Teeth Whitening (Laser)', 'تبييض الأسنان بالليزر', 'Removes stains for a brighter, whiter smile.', 'يزيل البقع للحصول على ابتسامة أكثر بياضاً.', 'laser', ARRAY['Cosmetic'], 24, true),
  ('Endodontic Treatment (Adults)', 'علاج الجذور للكبار', 'Disinfects root canals effectively with laser support.', 'يطهر قنوات الجذور بفعالية بمساعدة الليزر.', 'laser', ARRAY['Advanced'], 25, true),
  ('Pulpectomy in Pedo (Children)', 'علاج عصب الأسنان اللبنية', 'Safe root canal treatment for primary teeth.', 'علاج جذور آمن للأسنان اللبنية.', 'laser', ARRAY['Advanced','Pedo'], 26, true),
  ('TMJ Muscle Pain Therapy', 'علاج آلام عضلات المفصل الفكي', 'Relieves pain and inflammation in jaw muscles and TMJ.', 'يخفف ألم والتهاب عضلات الفك والمفصل.', 'laser', ARRAY['Advanced'], 27, true),
  ('Perio Pockets Treatment', 'علاج جيوب اللثة', 'Helps reduce bacteria and inflammation in periodontal pockets.', 'يقلل البكتيريا والالتهاب في جيوب اللثة.', 'laser', ARRAY['Advanced'], 28, true),
  ('Oral Surgeries', 'جراحات الفم', 'Precise cutting, minimal bleeding, faster recovery.', 'قطع دقيق ونزيف أقل وتعافٍ أسرع.', 'laser', ARRAY['Advanced','Surgery'], 29, true);
