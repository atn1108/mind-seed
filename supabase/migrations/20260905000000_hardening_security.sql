-- Security hardening pass (2026-09-05)
-- Run this in the Supabase SQL editor AFTER the room migrations. Idempotent.
--
-- 1. Block API-based role escalation: users can no longer set profiles.role
--    through PostgREST (column-level revoke, independent of RLS policies).
-- 2. Room passwords: bcrypt (cost 12) with per-row salt, legacy unsalted
--    SHA-256 hashes upgraded on first successful verify, 1s throttle on
--    every failed attempt (online brute-force cost).
-- 3. study_rooms UPDATE now re-checks ownership on the NEW row (was
--    `with check (true)`): a host can no longer retarget host_id or other
--    privileged columns to arbitrary users.
-- 4. EXP/sessions become server-side: complete_focus_session() and
--    complete_task() are SECURITY DEFINER RPCs so clients cannot write
--    arbitrary exp/goals directly.

-- ===========================================================================
-- 1. Role column is not client-writable
-- ===========================================================================
revoke update (role) on public.profiles from anon, authenticated;
revoke insert (role) on public.profiles from anon, authenticated;

-- ===========================================================================
-- 2. Room passwords: bcrypt + Throttle + legacy upgrade
-- ===========================================================================
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
      extensions.crypt(p_password, extensions.gen_salt('bf', 12))
    )
    on conflict (room_id) do update
      set password_hash = excluded.password_hash,
          updated_at = now();
    update public.study_rooms set has_password = true where id = p_room_id;
  end if;
end $$;

create or replace function public.join_room_with_password(p_room_id uuid, p_password text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hash text;
  v_matches boolean;
begin
  if auth.uid() is null then
    raise exception 'NOT_SIGNED_IN' using errcode = '42501';
  end if;

  select password_hash into v_hash
    from public.room_passwords
    where room_id = p_room_id;

  if v_hash is null or p_password is null then
    v_matches := false;
  elsif v_hash like '$2%' then
    -- bcrypt verify
    v_matches := (extensions.crypt(p_password, v_hash) = v_hash);
  else
    -- legacy unsalted sha256 stash (pre-hardening) — verify then upgrade
    v_matches := (encode(extensions.digest(p_password, 'sha256'), 'hex') = v_hash);
  end if;

  if not v_matches then
    -- Server-side throttle: with 1s per attempt, a 4-char password takes
    -- ~3h to brute over the network instead of seconds.
    perform pg_sleep(1.0);
    raise exception 'WRONG_PASSWORD' using errcode = 'P0001';
  end if;

  if v_hash like '$2%' is not true then
    update public.room_passwords
      set password_hash = extensions.crypt(p_password, extensions.gen_salt('bf', 12)),
          updated_at = now()
      where room_id = p_room_id;
  end if;

  insert into public.room_members (room_id, user_id)
  values (p_room_id, auth.uid())
  on conflict (room_id, user_id) do nothing;
end $$;

revoke execute on function public.join_room_with_password(uuid, text) from anon, public;
grant execute on function public.join_room_with_password(uuid, text) to authenticated;

-- ===========================================================================
-- 3. study_rooms UPDATE keeps ownership on the new row
-- ===========================================================================
do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'study_rooms'
      and cmd = 'UPDATE'
  loop
    execute format('drop policy if exists %I on public.study_rooms', pol.policyname);
  end loop;
end $$;

create policy "rooms_update_host_or_admin"
  on public.study_rooms for update
  to authenticated
  using (host_id = (select auth.uid()) or public.is_admin())
  with check (host_id = (select auth.uid()) or public.is_admin());

-- ===========================================================================
-- 4. Server-side EXP accounting
-- ===========================================================================
create or replace function public.complete_focus_session(p_minutes integer, p_completed boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_gained integer;
  v_exp integer;
  v_session public.focus_sessions;
  v_need constant integer := 150;
  v_forest_total integer;
  v_species_idx integer;
  v_species_names text[] := array['Sprout','Banyan','Blossom','Sea Palm','Evergreen','Maple'];
  v_unlock_at int[] := array[0,1,3,6,10,15];
  v_planted timestamptz := now();
  v_tree_id uuid;
  v_trees jsonb := '[]'::jsonb;
begin
  if v_user is null then
    raise exception 'NOT_SIGNED_IN' using errcode = '42501';
  end if;
  if p_minutes is null or p_minutes < 1 or p_minutes > 180 then
    raise exception 'INVALID_MINUTES' using errcode = 'P0001';
  end if;

  -- Anti-farming caps: max 30 inserts/day, 10 completed/day, 720 min completed/day.
  if (
    (select count(*) >= 30
       from public.focus_sessions
      where user_id = v_user and started_at >= date_trunc('day', now()))
    or (select count(*) >= 10
          from public.focus_sessions
         where user_id = v_user and completed
           and started_at >= date_trunc('day', now()))
    or (select coalesce(sum(minutes), 0) + case when p_completed then p_minutes else 0 end > 720
          from public.focus_sessions
         where user_id = v_user and completed
           and started_at >= date_trunc('day', now()))
  ) then
    raise exception 'DAILY_LIMIT' using errcode = 'P0001';
  end if;

  insert into public.focus_sessions (user_id, started_at, minutes, completed)
  values (v_user, now(), p_minutes, coalesce(p_completed, false))
  returning * into v_session;

  v_gained := case when v_session.completed then v_session.minutes else round(v_session.minutes * 0.2) end;

  update public.profiles set exp = exp + v_gained where id = v_user
  returning exp into v_exp;

  if v_exp is null then
    raise exception 'PROFILE_NOT_FOUND' using errcode = 'P0001';
  end if;

  -- Materialize trees exactly like the old client logic (each tree costs 150 exp).
  select count(*) into v_forest_total from public.garden_trees where user_id = v_user;

  while v_exp >= v_need loop
    v_exp := v_exp - v_need;
    v_forest_total := v_forest_total + 1;
    -- species index = (# thresholds <= current forest) - 1, floored at 0
    v_species_idx := greatest(0,
      (select count(*) from unnest(v_unlock_at) as t(x) where t.x <= v_forest_total) - 1);
    v_tree_id := gen_random_uuid();
    insert into public.garden_trees (id, user_id, species, planted_at, minutes)
    values (v_tree_id, v_user, v_species_names[v_species_idx + 1], v_planted, v_session.minutes);
    v_trees := v_trees || jsonb_build_object(
      'id',        v_tree_id,
      'species',   v_species_names[v_species_idx + 1],
      'planted_at', v_planted,
      'minutes',   v_session.minutes
    );
  end loop;

  -- Persist the remainder after tree growth (matches the legacy client math).
  update public.profiles set exp = v_exp where id = v_user;

  return jsonb_build_object(
    'exp',        v_exp,
    'session_id', v_session.id,
    'started_at', v_session.started_at,
    'minutes',    v_session.minutes,
    'completed',  v_session.completed,
    'trees',      v_trees
  );
end $$;

revoke execute on function public.complete_focus_session(integer, boolean) from anon, public;
grant execute on function public.complete_focus_session(integer, boolean) to authenticated;

-- Once sessions/trees/exp are RPC-managed, forbid direct client writes through
-- PostgREST so the anti-farming caps cannot be bypassed. Security definer RPCs
-- run as the owner and are unaffected.
revoke insert, update, delete on public.focus_sessions from anon, authenticated;
revoke insert on public.garden_trees from anon, authenticated;
revoke update (exp) on public.profiles from anon, authenticated;

create or replace function public.complete_task(p_task_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_exp integer;
begin
  if v_user is null then
    raise exception 'NOT_SIGNED_IN' using errcode = '42501';
  end if;

  -- Atomic: only flips done and grants EXP once per task, and only to its owner.
  update public.tasks
     set done = true
   where id = p_task_id
     and user_id = v_user
     and done = false;

  if not found then
    select exp into v_exp from public.profiles where id = v_user;
    if v_exp is null then
      raise exception 'PROFILE_NOT_FOUND' using errcode = 'P0001';
    end if;
    return v_exp;
  end if;

  update public.profiles set exp = exp + 12 where id = v_user
  returning exp into v_exp;

  return v_exp;
end $$;

revoke execute on function public.complete_task(uuid) from anon, public;
grant execute on function public.complete_task(uuid) to authenticated;

-- ===========================================================================
-- 5. Avatar must be a local data-URI image (no external tracking pixels)
-- ===========================================================================
create or replace function public.validate_profile_avatar() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.avatar is not null
     and new.avatar <> ''
     and new.avatar !~ '^data:image/(png|jpeg|webp|gif);base64,'
  then
    raise exception 'INVALID_AVATAR' using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists validate_profile_avatar_on_profiles on public.profiles;
create trigger validate_profile_avatar_on_profiles
  before insert or update on public.profiles
  for each row execute function public.validate_profile_avatar();

-- ===========================================================================
-- Sanity output
-- ===========================================================================
do $$
declare
  n_fn int;
  n_pol int;
begin
  select count(*) into n_fn
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname in ('set_room_password','join_room_with_password','complete_focus_session','complete_task');
  select count(*) into n_pol
    from pg_policies where schemaname = 'public' and tablename = 'study_rooms';
  raise notice 'OK: %/4 security functions present; study_rooms now has % policies', n_fn, n_pol;
end $$;