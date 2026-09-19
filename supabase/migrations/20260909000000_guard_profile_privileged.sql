-- The column-level REVOKEs on profiles(role, exp) were always no-ops:
-- authenticated holds table-level UPDATE on profiles (needed for
-- name/avatar/goal edits), which covers every column. Real guard =
-- trigger that rejects role/exp changes from API roles, while letting
-- the server-side RPCs through (they run as owner: current_user postgres).
create or replace function public.guard_profile_privileged() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('postgres', 'service_role') then
    return new;
  end if;
  if new.role is distinct from old.role then
    raise exception 'FORBIDDEN_ROLE' using errcode = '42501';
  end if;
  if new.exp is distinct from old.exp then
    raise exception 'FORBIDDEN_EXP' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists guard_profile_privileged_on_profiles on public.profiles;
create trigger guard_profile_privileged_on_profiles
  before update on public.profiles
  for each row execute function public.guard_profile_privileged();

-- Keep the (insufficient alone) revokes as documentation/defense-in-depth.
revoke update (role) on public.profiles from anon, authenticated;
revoke insert (role) on public.profiles from anon, authenticated;
revoke update (exp) on public.profiles from anon, authenticated;
