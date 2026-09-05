-- Admin role for room moderation.
-- admins may delete any room, take over/update any room's shared timer.

alter table public.profiles
  add column if not exists role text not null default 'user';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('user', 'admin'));
  end if;
end $$;

-- Policy helper. SECURITY DEFINER avoids recursive RLS on profiles.
-- EXECUTE stays private: it is only meant for policy expressions,
-- never callable through PostgREST (keeps lints 0028/0029 quiet).
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

-- Promote the test admin created earlier (adjust email if different).
update public.profiles set role = 'admin' where email = 'admin@test.com';

-- Widen room policies to include admins.
drop policy "Host updates room; member claims it after host leaves"
  on public.study_rooms;
create policy "Host, admin, or host-less member updates room"
  on public.study_rooms for update
  to authenticated
  using (
    host_id = (select auth.uid())
    or public.is_admin()
    or (
      exists (
        select 1 from public.room_members m
        where m.room_id = id and m.user_id = (select auth.uid())
      )
      and exists (
        select 1 from public.study_rooms r
        where r.id = id
          and not exists (
            select 1 from public.room_members h
            where h.room_id = id and h.user_id = r.host_id
          )
      )
    )
  );

drop policy "Host deletes own room" on public.study_rooms;
create policy "Host or admin deletes room"
  on public.study_rooms for delete
  to authenticated
  using (host_id = (select auth.uid()) or public.is_admin());
