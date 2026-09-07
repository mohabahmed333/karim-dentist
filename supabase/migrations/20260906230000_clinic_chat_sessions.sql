-- Allow many reception chat sessions (history list); drop singleton home
-- Rollback: recreate unique home index if needed

DROP INDEX IF EXISTS public.clinic_chat_threads_home_unique;
