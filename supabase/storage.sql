-- LikeSized V1 Storage configuration
-- Canonical bootstrap for private Closet photos.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'closet-photos',
  'closet-photos',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "owners upload closet photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'closet-photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "owners read closet photos"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'closet-photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "owners update closet photos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'closet-photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'closet-photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "owners delete closet photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'closet-photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
