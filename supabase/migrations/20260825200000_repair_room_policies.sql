-- Repair pass: wipe and rebuild every study_rooms policy in one place.
-- Safe to re-run (idempotent).

-- 1. Policy helper (recreated defensively).
create or replace function public.is_admin() returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  )
$$;

revoke execute on function public.is_admin() from public, anon, authenticated;

-- 2. Drop every policy currently on the table (any generation/naming).
do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'study_rooms'
  loop
    execute format('drop policy if exists %I on public.study_rooms', pol.policyname);
    raise notice 'dropped policy %', pol.policyname;
  end loop;
end $$;

-- 3. Rebuild clean, minimal rules. Host owns its rooms; admins moderate.
create policy "rooms_select_authenticated"
  on public.study_rooms for select
  to authenticated
  using (true);

create policy "rooms_insert_host"
  on public.study_rooms for insert
  to authenticated
  with check (host_id = (select auth.uid()));

create policy "rooms_update_host_or_admin"
  on public.study_rooms for update
  to authenticated
  using (host_id = (select auth.uid()) or public.is_admin())
  with check (true);

create policy "rooms_delete_host_or_admin"
  on public.study_rooms for delete
  to authenticated
  using (host_id = (select auth.uid()) or public.is_admin());

-- 4. Loud summary so failures are visible in the SQL editor output.
do $$
declare
  pol_count int;
  col_count int;
begin
  select count(*) into col_count
    from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'role';
  select count(*) into pol_count
    from pg_policies
    where schemaname = 'public' and tablename = 'study_rooms';

  if col_count = 0 then
    raise exception 'FATAL: public.profiles.role column missing — run 20260825100000_admin_role.sql first';
  end if;
  if pol_count <> 4 then
    raise exception 'FATAL: expected 4 policies on study_rooms, found %', pol_count;
  end if;
  raise notice 'OK: role column present, % policies active on study_rooms', pol_count;
end $$;
