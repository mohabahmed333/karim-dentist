-- hero.layout, which production already has and no migration created.
--
-- Found while restoring the hand-narrowed types: database.types.ts was
-- regenerated against production and picked up a `layout` column that exists
-- there but in no migration here, so `supabase db reset --local` produced a
-- schema the code no longer compiled against. Added idempotently, with the
-- default production is actually using, so it is a no-op there and a repair
-- everywhere else.
--
-- Rollback:
--   ALTER TABLE public.hero DROP COLUMN IF EXISTS layout;

ALTER TABLE public.hero
  ADD COLUMN IF NOT EXISTS layout text NOT NULL DEFAULT 'classic';
