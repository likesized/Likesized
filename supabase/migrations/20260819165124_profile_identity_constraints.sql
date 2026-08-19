-- Keep member-facing profile identity bounded even when writes bypass app forms.
-- Raw Fit Profile measurements and size references remain governed separately and private.

alter table public.profiles
  add constraint profiles_display_name_length check (
    display_name is null or char_length(display_name) <= 80
  ),
  add constraint profiles_bio_length check (
    bio is null or char_length(bio) <= 300
  ),
  add constraint profiles_avatar_url_length check (
    avatar_url is null or char_length(avatar_url) <= 2048
  );

comment on column public.profiles.display_name is
  'Optional member-facing display name. Discoverable with a completed profile; never a body measurement.';
comment on column public.profiles.bio is
  'Optional member-facing bio. Discoverable with a completed profile; never a body measurement.';
comment on column public.profiles.avatar_url is
  'Reserved member-facing avatar location. V1 does not expose avatar editing until an intentional storage model exists.';
