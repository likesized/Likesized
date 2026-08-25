alter table public.outfit_photos
  add column caption text;

alter table public.outfit_photos
  add constraint outfit_photos_caption_length
  check (caption is null or char_length(caption) <= 200);
