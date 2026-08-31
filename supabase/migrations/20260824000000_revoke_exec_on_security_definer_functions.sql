-- Fixes Supabase security lints 0028 / 0029:
-- handle_new_user() and rls_auto_enable() are SECURITY DEFINER trigger helpers
-- that must never be callable directly through PostgREST (/rest/v1/rpc/*).
-- Triggers invoke these functions internally, so revoking EXECUTE is safe.

REVOKE EXECUTE ON FUNCTION public.handle_new_user()
  FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.rls_auto_enable()
  FROM anon, authenticated;
