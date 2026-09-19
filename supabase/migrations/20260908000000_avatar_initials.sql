-- Fix: validate_profile_avatar rejected single-letter initials, which
-- handle_new_user() writes for EVERY new signup -> all registration 500'd
-- with INVALID_AVATAR, and old users with initial-avatars could never
-- update their profile again. Security goal is blocking external URLs
-- (tracking pixels), not short display initials, so allow <= 2 chars.
create or replace function public.validate_profile_avatar() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.avatar is not null
     and new.avatar <> ''
     and new.avatar !~ '^data:image/(png|jpeg|webp|gif);base64,'
     and char_length(new.avatar) > 2
  then
    raise exception 'INVALID_AVATAR' using errcode = 'P0001';
  end if;
  return new;
end $$;
