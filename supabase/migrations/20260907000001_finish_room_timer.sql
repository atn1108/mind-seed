-- Any room member may close an expired running timer.
-- Fixes rooms stuck at 00:00 when the host is offline: previously only the
-- host/admin (RLS rooms_update_host_or_admin) could patch back to idle.
create or replace function public.finish_room_timer(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'NOT_SIGNED_IN' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.room_members m
    where m.room_id = p_room_id and m.user_id = auth.uid()
  ) and not public.is_admin() then
    raise exception 'NOT_ROOM_MEMBER' using errcode = '42501';
  end if;

  update public.study_rooms r
     set status = 'idle',
         remaining_sec = r.duration_min * 60,
         ends_at = null
   where r.id = p_room_id
     and r.status = 'running'
     and r.ends_at is not null
     and r.ends_at <= now();
end $$;

revoke execute on function public.finish_room_timer(uuid) from anon, public;
grant execute on function public.finish_room_timer(uuid) to authenticated;
