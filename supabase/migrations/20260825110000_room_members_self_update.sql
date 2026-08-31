-- Safety net: allow members to re-affirm their own membership row.
-- ignoreDuplicates upserts (ON CONFLICT DO NOTHING) never need this, but a
-- merge-duplicates write would otherwise 403 for existing rows.

create policy "Users refresh own membership"
  on public.room_members for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
