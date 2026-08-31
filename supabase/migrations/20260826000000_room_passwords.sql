-- Password-protected rooms + shareable invite links.
--
-- Secrets live in a dedicated table that NO role can read through the API
-- (no SELECT policy at all -> default deny). Verification happens inside
-- SECURITY DEFINER RPCs so plaintext/hashes never reach the client.

create extension if not exists pgcrypto with schema extensions;

-- 1. Flag on the room so lobbies can show a lock icon without any secret.
alter table public.study_rooms
  add column if not exists has_password boolean not null default false;

-- 2. Secret store. No SELECT policy: hashes are invisible to every client.
create table if not exists public.room_passwords (
  room_id uuid primary key references public.study_rooms (id) on delete cascade,
  password_hash text not null,
  updated_at timestamptz not null default now()
);

alter table public.room_passwords enable row level security;

-- Hosts (or admins) may set, rotate and remove their own room's password.
-- Deliberately NO select/update-read policies beyond these write paths.
create policy "Host inserts room password"
  on public.room_passwords for insert
  to authenticated
  with check (
    exists (
      select 1 from public.study_rooms r
      where r.id = room_id
        and (r.host_id = (select auth.uid()) or public.is_admin())
    )
  );

create policy "Host updates room password"
  on public.room_passwords for update
  to authenticated
  using (
    exists (
      select 1 from public.study_rooms r
      where r.id = room_id
        and (r.host_id = (select auth.uid()) or public.is_admin())
    )
  );

create policy "Host deletes room password"
  on public.room_passwords for delete
  to authenticated
  using (
    exists (
      select 1 from public.study_rooms r
      where r.id = room_id
        and (r.host_id = (select auth.uid()) or public.is_admin())
    )
  );

-- 3. Host sets / clears the password (null clears it).
create or replace function public.set_room_password(p_room_id uuid, p_password text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_owner boolean;
begin
  if p_password is not null and char_length(p_password) < 4 then
    raise exception 'PASSWORD_TOO_SHORT' using errcode = 'P0001';
  end if;

  select exists (
    select 1 from public.study_rooms
    where id = p_room_id
      and (host_id = auth.uid() or exists (
        select 1 from public.profiles pr
        where pr.id = auth.uid() and pr.role = 'admin'
      ))
  )
  into v_is_owner;

  if not v_is_owner then
    raise exception 'NOT_ROOM_OWNER' using errcode = '42501';
  end if;

  if p_password is null then
    delete from public.room_passwords where room_id = p_room_id;
    update public.study_rooms set has_password = false where id = p_room_id;
  else
    insert into public.room_passwords (room_id, password_hash)
    values (
      p_room_id,
      encode(extensions.digest(p_password, 'sha256'), 'hex')
    )
    on conflict (room_id) do update
      set password_hash = excluded.password_hash,
          updated_at = now();
    update public.study_rooms set has_password = true where id = p_room_id;
  end if;
end $$;

revoke execute on function public.set_room_password(uuid, text) from anon, public;

grant execute on function public.set_room_password(uuid, text) to authenticated;

-- 4. Password-gated join: verifies the candidate, then registers membership.
-- Raises WRONG_PASSWORD (P0001) on mismatch; silently succeeds if already a member.
create or replace function public.join_room_with_password(p_room_id uuid, p_password text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hash text;
begin
  if auth.uid() is null then
    raise exception 'NOT_SIGNED_IN' using errcode = '42501';
  end if;

  select password_hash into v_hash
    from public.room_passwords
    where room_id = p_room_id;

  if v_hash is null or p_password is null
     or encode(extensions.digest(p_password, 'sha256'), 'hex') <> v_hash then
    raise exception 'WRONG_PASSWORD' using errcode = 'P0001';
  end if;

  insert into public.room_members (room_id, user_id)
  values (p_room_id, auth.uid())
  on conflict (room_id, user_id) do nothing;
end $$;

revoke execute on function public.join_room_with_password(uuid, text) from anon, public;

grant execute on function public.join_room_with_password(uuid, text) to authenticated;

-- 5. Sanity output for the SQL editor.
do $$
declare
  pol_count int;
begin
  select count(*) into pol_count from pg_policies
   where schemaname = 'public' and tablename = 'room_passwords';
  if pol_count <> 3 then
    raise exception 'FATAL: expected 3 write policies on room_passwords, found %', pol_count;
  end if;
  raise notice 'OK: room passwords ready (hashes API-invisible, 2 RPCs granted to authenticated)';
end $$;
