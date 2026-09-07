-- Experience entries: optional body copy for the redesigned list layout
ALTER TABLE public.experience_entries
  ADD COLUMN IF NOT EXISTS description text;

UPDATE public.experience_entries
SET description = COALESCE(
  description,
  'Once upon a time, a designer named Galil left Cairo for Riyadh with a sketchbook and a stubborn eye for craft.'
)
WHERE description IS NULL;
