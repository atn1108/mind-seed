-- Fix: "42501 permission denied for function is_admin"
--
-- The previous version was SECURITY DEFINER with EXECUTE revoked from every
-- role. Policy expressions still evaluate the is_admin() branch, so every
-- UPDATE / DELETE on study_rooms died with a privilege error even for hosts.
--
-- Recreate as an INVOKER-rights function (plain, not SECURITY DEFINER):
--   * EXECUTE stays granted -> policies can always call it
--   * no longer SECURITY DEFINER -> Supabase lints 0028/0029 stay quiet
-- Reading its own profile row is allowed by profiles' own RLS, which the
-- app already relies on everywhere.

-- NOTE: cannot DROP this function — study_rooms policies depend on it.
-- CREATE OR REPLACE with the same signature swaps the definition in place.

create or replace function public.is_admin() returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  )
$$;

grant execute on function public.is_admin() to public, anon, authenticated;

-- Loud sanity check in the editor output.
do $$
declare
  fn_priv boolean;
  pol_count int;
begin
  select has_function_privilege('authenticated', 'public.is_admin()', 'EXECUTE')
    into fn_priv;
  select count(*) into pol_count
    from pg_policies
    where schemaname = 'public'
      and tablename = 'study_rooms'
      and policyname like '%host_or_admin%';

  if fn_priv is distinct from true then
    raise exception 'FATAL: authenticated still cannot execute is_admin()';
  end if;
  if pol_count < 2 then
    raise exception 'FATAL: expected update+delete policies on study_rooms, found %', pol_count;
  end if;
  raise notice 'OK: is_admin() executable by authenticated, % policies reference it', pol_count;
end $$;
