-- LikeSized V1 Storage configuration
-- Canonical bootstrap for Closet and Outfit photos.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  (
    'closet-photos',
    'closet-photos',
    false,
    8388608,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'outfit-photos',
    'outfit-photos',
    false,
    8388608,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Closet photos stay visible only to their owner.
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

-- Outfit posts are member-facing. Signed-in members may read post images,
-- while only the owner may create, replace, or delete files in their folder.
create policy "members read outfit photos"
on storage.objects
for select
to authenticated
using (bucket_id = 'outfit-photos');

create policy "owners upload outfit photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'outfit-photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "owners update outfit photos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'outfit-photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'outfit-photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "owners delete outfit photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'outfit-photos'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
