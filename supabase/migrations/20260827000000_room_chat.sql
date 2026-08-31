-- Study Room Chat Messages
create table public.room_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.study_rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  user_name text not null,
  user_avatar text,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

create index room_messages_room_created_idx on public.room_messages (room_id, created_at asc);

alter table public.room_messages enable row level security;

create policy "Signed-in users can view messages of rooms they belong to"
  on public.room_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.room_members m
      where m.room_id = room_messages.room_id and m.user_id = (select auth.uid())
    )
  );

create policy "Room members can insert messages"
  on public.room_messages for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.room_members m
      where m.room_id = room_messages.room_id and m.user_id = (select auth.uid())
    )
  );

alter publication supabase_realtime add table public.room_messages;
