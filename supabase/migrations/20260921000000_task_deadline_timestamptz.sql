-- Tasks: store a due *time*, not just a date.
-- Old date values are interpreted as local midnight (Asia/Ho_Chi_Minh,
-- the app's primary locale) so existing deadlines keep showing the same day.
alter table public.tasks
  alter column deadline type timestamptz
  using (
    case
      when deadline is null then null
      else (deadline::text || ' 00:00:00+07')::timestamptz
    end
  );
