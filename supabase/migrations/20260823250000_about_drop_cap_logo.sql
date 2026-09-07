-- Optional drop-cap logo (image). When null/empty, letter drop_cap may be used; both empty = no drop cap.
ALTER TABLE public.about
  ADD COLUMN IF NOT EXISTS drop_cap_logo_url text;

ALTER TABLE public.about
  ALTER COLUMN drop_cap SET DEFAULT '';

UPDATE public.about
SET drop_cap = COALESCE(drop_cap, '');
