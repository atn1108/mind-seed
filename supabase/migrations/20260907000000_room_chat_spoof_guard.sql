-- Spoof guard: server fills user_name/avatar from profiles, ignores client values.
-- Client could previously insert any user_name and impersonate other members.
create or replace function public.fill_room_message_author()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
  v_avatar text;
begin
  select p.name, p.avatar into v_name, v_avatar
    from public.profiles p where p.id = auth.uid();
  new.user_id := auth.uid();
  new.user_name := coalesce(v_name, 'User');
  new.user_avatar := v_avatar;
  return new;
end $$;

drop trigger if exists fill_room_message_author_on_insert on public.room_messages;
create trigger fill_room_message_author_on_insert
  before insert on public.room_messages
  for each row execute function public.fill_room_message_author();
