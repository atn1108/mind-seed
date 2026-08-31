-- Study Rooms (basic version)
-- Public rooms with invite code, one shared host-controlled timer,
-- live member list via Realtime presence. Requires sign-in.

create table public.study_rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  host_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'idle' check (status in ('idle', 'running', 'paused')),
  duration_min int not null default 25 check (duration_min between 5 and 180),
  remaining_sec int not null default 1500,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.room_members (
  room_id uuid not null references public.study_rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create index study_rooms_created_idx on public.study_rooms (created_at desc);
create index room_members_user_idx on public.room_members (user_id);

alter table public.study_rooms enable row level security;
alter table public.room_members enable row level security;

-- Rooms: everyone signed in can see the lobby; only the creator can open a room;
-- members may control the timer once the host is gone (host handover).
create policy "Signed-in users can view rooms"
  on public.study_rooms for select
  to authenticated
  using (true);

create policy "Creator inserts own room"
  on public.study_rooms for insert
  to authenticated
  with check (host_id = (select auth.uid()));

create policy "Host updates room; member claims it after host leaves"
  on public.study_rooms for update
  to authenticated
  using (
    host_id = (select auth.uid())
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

create policy "Host deletes own room"
  on public.study_rooms for delete
  to authenticated
  using (host_id = (select auth.uid()));

-- Members: visible to signed-in users (lobby counts), self-service join/leave.
create policy "Signed-in users can view members"
  on public.room_members for select
  to authenticated
  using (true);

create policy "Users join rooms as themselves"
  on public.room_members for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users leave rooms themselves"
  on public.room_members for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- Stream row changes to subscribed clients.
alter publication supabase_realtime add table public.study_rooms;
alter publication supabase_realtime add table public.room_members;
