-- MindSeed EXP economy v2 (2026-09-21)
-- 1. Session EXP by duration: 5m->10, 10m->20, 25m->45, 45m->90, else 2x minutes.
-- 2. Milestones at 20/40/60/80/100% of the planned duration: finishing grants
--    the full amount; ending early grants total * milestones_reached / 5
--    (no milestone reached = no reward). Needs the planned duration, so the
--    client now sends p_duration (nullable for backward compatibility).
-- 3. Tree cost grows with the forest so higher levels need wider gaps:
--    need(n) = 120 + 40*n + 20*n^2 (n = trees already planted):
--    120, 180, 280, 420, 600, ...
-- Signature changes, so drop + recreate instead of CREATE OR REPLACE.

drop function if exists public.complete_focus_session(integer, boolean);

create function public.complete_focus_session(
  p_minutes integer,
  p_completed boolean,
  p_duration integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_duration integer;
  v_total integer;
  v_gained integer;
  v_exp integer;
  v_session public.focus_sessions;
  v_forest_total integer;
  v_need integer;
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

  -- Planned duration; fall back to logged minutes for old clients.
  if p_duration is null or p_duration < 1 or p_duration > 180 then
    v_duration := p_minutes;
  else
    v_duration := p_duration;
  end if;

  -- Session EXP table (5m->10, 10m->20, 25m->45, 45m->90, else 2x minutes).
  v_total := case v_duration
    when 5 then 10
    when 10 then 20
    when 25 then 45
    when 45 then 90
    else v_duration * 2
  end;

  if coalesce(p_completed, false) then
    v_gained := v_total;
  elsif p_duration is null or p_duration < 1 or p_duration > 180 then
    v_gained := round(v_total * 0.2);
  else
    -- Milestones at 20/40/60/80/100% of the planned duration.
    v_gained := round(
      v_total * least(4, floor(p_minutes::double precision / v_duration * 5)) / 5.0
    );
  end if;

  insert into public.focus_sessions (user_id, started_at, minutes, completed)
  values (v_user, now(), p_minutes, coalesce(p_completed, false))
  returning * into v_session;

  update public.profiles set exp = exp + v_gained where id = v_user
  returning exp into v_exp;

  if v_exp is null then
    raise exception 'PROFILE_NOT_FOUND' using errcode = 'P0001';
  end if;

  -- Materialize trees; each new tree costs more than the previous one so
  -- higher levels need wider gaps: need(n) = 120 + 40*n + 20*n^2.
  select count(*) into v_forest_total from public.garden_trees where user_id = v_user;

  loop
    v_need := 120 + 40 * v_forest_total + 20 * v_forest_total * v_forest_total;
    exit when v_exp < v_need;
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
    'gained',     v_gained,
    'session_id', v_session.id,
    'started_at', v_session.started_at,
    'minutes',    v_session.minutes,
    'completed',  v_session.completed,
    'trees',      v_trees
  );
end $$;

revoke execute on function public.complete_focus_session(integer, boolean, integer) from anon, public;
grant execute on function public.complete_focus_session(integer, boolean, integer) to authenticated;
