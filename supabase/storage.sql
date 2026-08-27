-- LikeSized V1 Storage configuration
-- Support/reference mirror only. This file is not a second canonical current-state schema.
-- Ordered files in supabase/migrations/ are the executable database history; supabase/schema_contract.md owns current database behavior/privacy meaning.
-- Fit/reference photos, Outfit photos, and profile photos are optional.
-- Profile photos are member-facing identity and are readable only by authenticated members.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('fit-reference-photos','fit-reference-photos',false,8388608,array['image/jpeg','image/png','image/webp']),
  ('outfit-photos','outfit-photos',false,8388608,array['image/jpeg','image/png','image/webp']),
  ('profile-photos','profile-photos',false,1048576,array['image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- The retired closet-photos bucket may still exist empty in hosted Supabase because buckets cannot be SQL-dropped directly.
-- It has no LikeSized read/write policies and must never be used by application code.

create policy "members read fit reference photos" on storage.objects for select to authenticated using (bucket_id = 'fit-reference-photos');
create policy "owners upload fit reference photos" on storage.objects for insert to authenticated with check (bucket_id = 'fit-reference-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "owners update fit reference photos" on storage.objects for update to authenticated using (bucket_id = 'fit-reference-photos' and (storage.foldername(name))[1] = (select auth.uid()::text)) with check (bucket_id = 'fit-reference-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "owners delete fit reference photos" on storage.objects for delete to authenticated using (bucket_id = 'fit-reference-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "members read outfit photos" on storage.objects for select to authenticated using (bucket_id = 'outfit-photos');
create policy "owners upload outfit photos" on storage.objects for insert to authenticated with check (bucket_id = 'outfit-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "owners update outfit photos" on storage.objects for update to authenticated using (bucket_id = 'outfit-photos' and (storage.foldername(name))[1] = (select auth.uid()::text)) with check (bucket_id = 'outfit-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "owners delete outfit photos" on storage.objects for delete to authenticated using (bucket_id = 'outfit-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));

create policy "members read profile photos" on storage.objects for select to authenticated using (bucket_id = 'profile-photos');
create policy "owners upload profile photos" on storage.objects for insert to authenticated with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "owners update profile photos" on storage.objects for update to authenticated using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = (select auth.uid()::text)) with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));
create policy "owners delete profile photos" on storage.objects for delete to authenticated using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = (select auth.uid()::text));
