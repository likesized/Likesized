begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, auth;

select plan(33);

insert into auth.users (id,aud,role,email,created_at,updated_at)
values
  ('e0000000-0000-4000-8000-000000000001'::uuid,'authenticated','authenticated','outfit-a@likesized.test',now(),now()),
  ('e0000000-0000-4000-8000-000000000002'::uuid,'authenticated','authenticated','outfit-b@likesized.test',now(),now());

set local role authenticated;
set local request.jwt.claim.sub='e0000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select public.save_fit_profile(
  'outfit_a','imperial'::public.unit_system,
  '[{"measurement_type_key":"height","entered_value":68,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"natural_waist","entered_value":31,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,
  '[]'::jsonb
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub='e0000000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
select public.save_fit_profile(
  'outfit_b','imperial'::public.unit_system,
  '[{"measurement_type_key":"height","entered_value":70,"entered_unit":"in","source":"manual","method":"tape"},{"measurement_type_key":"natural_waist","entered_value":33,"entered_unit":"in","source":"manual","method":"tape"}]'::jsonb,
  '[]'::jsonb
);
reset role;

insert into public.brands(id,name,slug,normalized_name)
values('e1000000-0000-4000-8000-000000000001'::uuid,'Outfit Test','outfit-test','outfittest');
insert into public.products(id,brand_id,name,slug,category,normalized_name,garment_type_key,market_segment,image_url)
values('e2000000-0000-4000-8000-000000000001'::uuid,'e1000000-0000-4000-8000-000000000001'::uuid,'Integration Jeans','outfit-test-integration-jeans','bottoms','integrationjeans','jeans','unisex','https://example.test/product.webp');

set local role authenticated;
set local request.jwt.claim.sub='e0000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
insert into public.closet_items(id,user_id,product_id,size_label,wears_count)
values('e3000000-0000-4000-8000-000000000001'::uuid,'e0000000-0000-4000-8000-000000000001'::uuid,'e2000000-0000-4000-8000-000000000001'::uuid,'M',0);
insert into public.fit_reports(id,user_id,closet_item_id,product_id,fit_profile_version_id,size_label,fit)
select 'e4000000-0000-4000-8000-000000000001'::uuid,'e0000000-0000-4000-8000-000000000001'::uuid,'e3000000-0000-4000-8000-000000000001'::uuid,'e2000000-0000-4000-8000-000000000001'::uuid,current_version_id,'M','just_right'
from public.fit_profiles where user_id='e0000000-0000-4000-8000-000000000001'::uuid;

select public.save_outfit_post_content(
  'e5000000-0000-4000-8000-000000000001'::uuid,
  'Old Money Layers',
  'A longer Outfit Story for the V1 editorial post.',
  array['e3000000-0000-4000-8000-000000000001'::uuid],
  array['everyday'],
  array['Old Money'],
  true
);

select is(
  (select status::text from public.outfit_posts where id='e5000000-0000-4000-8000-000000000001'::uuid),
  'draft',
  'saving Outfit content creates an owner-only draft'
);
select is(
  (select normalized_tag from public.outfit_style_tags where post_id='e5000000-0000-4000-8000-000000000001'::uuid),
  'oldmoney',
  'freeform Style Tags are normalized for discovery without changing display text'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub='e0000000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
select is(
  (select count(*) from public.outfit_posts where id='e5000000-0000-4000-8000-000000000001'::uuid),
  0::bigint,
  'another member cannot read an Outfit draft'
);
reset role;

set local request.jwt.claim.sub='';
set local request.jwt.claim.role='anon';
set local role anon;
select is(
  (select count(*) from public.outfit_posts where id='e5000000-0000-4000-8000-000000000001'::uuid),
  0::bigint,
  'logged-out visitors cannot read an Outfit draft'
);
select is(
  (select count(*) from public.get_public_outfit_creator('e5000000-0000-4000-8000-000000000001'::uuid)),
  0::bigint,
  'public creator projection returns nothing for a draft'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub='e0000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select public.register_outfit_photo(
  'e5000000-0000-4000-8000-000000000001'::uuid,
  'e6000000-0000-4000-8000-000000000001'::uuid,
  'outfit-photos',
  'e0000000-0000-4000-8000-000000000001/e5000000-0000-4000-8000-000000000001/e6000000-0000-4000-8000-000000000001/display.webp',
  'e0000000-0000-4000-8000-000000000001/e5000000-0000-4000-8000-000000000001/e6000000-0000-4000-8000-000000000001/feed.webp'
);
select public.sync_outfit_photo_order(
  'e5000000-0000-4000-8000-000000000001'::uuid,
  array['e6000000-0000-4000-8000-000000000001'::uuid],
  'e6000000-0000-4000-8000-000000000001'::uuid
);
select public.replace_outfit_photo_tags(
  'e6000000-0000-4000-8000-000000000001'::uuid,
  '[{"closet_item_id":"e3000000-0000-4000-8000-000000000001","x":0.45,"y":0.55}]'::jsonb
);
select public.publish_outfit_post('e5000000-0000-4000-8000-000000000001'::uuid);

select is(
  (select status::text from public.outfit_posts where id='e5000000-0000-4000-8000-000000000001'::uuid),
  'published',
  'publish transitions the existing draft instead of creating a duplicate Outfit'
);
select is(
  (select count(*) from public.outfit_photos where post_id='e5000000-0000-4000-8000-000000000001'::uuid),
  1::bigint,
  'published Outfit keeps its canonical gallery row'
);
select is(
  (select count(*) from public.outfit_photo_tags where photo_id='e6000000-0000-4000-8000-000000000001'::uuid and closet_item_id='e3000000-0000-4000-8000-000000000001'::uuid),
  1::bigint,
  'photo-level garment hotspot persists on the tagged master garment'
);
reset role;

set local role authenticated;
set local request.jwt.claim.sub='e0000000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
select is(
  (select count(*) from public.outfit_posts where id='e5000000-0000-4000-8000-000000000001'::uuid),
  1::bigint,
  'another member can read a published Outfit'
);
select is(
  (select count(*) from public.outfit_post_items where post_id='e5000000-0000-4000-8000-000000000001'::uuid),
  1::bigint,
  'signed-in members can read the Outfit garment relationship'
);

insert into public.outfit_likes(post_id,user_id)
values('e5000000-0000-4000-8000-000000000001'::uuid,'e0000000-0000-4000-8000-000000000002'::uuid);
insert into public.outfit_comments(id,post_id,user_id,body)
values('e7000000-0000-4000-8000-000000000001'::uuid,'e5000000-0000-4000-8000-000000000001'::uuid,'e0000000-0000-4000-8000-000000000002'::uuid,'This styling works really well.');
select public.follow_from_outfit('e5000000-0000-4000-8000-000000000001'::uuid);

select is(
  (select like_count from public.outfit_posts where id='e5000000-0000-4000-8000-000000000001'::uuid),
  1,
  'Outfit like counter follows the canonical like relationship'
);
select is(
  (select comment_count from public.outfit_posts where id='e5000000-0000-4000-8000-000000000001'::uuid),
  1,
  'Outfit comment counter follows the canonical flat comment thread'
);
select is(
  (select count(*) from public.follows where follower_id='e0000000-0000-4000-8000-000000000002'::uuid and followed_id='e0000000-0000-4000-8000-000000000001'::uuid),
  1::bigint,
  'Follow from Outfit reuses the one canonical follows graph'
);
select is(
  (select follows_generated_count from public.outfit_posts where id='e5000000-0000-4000-8000-000000000001'::uuid),
  1,
  'creator analytics count a new follow generated from the Outfit'
);
select throws_like(
  $$insert into public.outfit_comments(post_id,user_id,body) values('e5000000-0000-4000-8000-000000000001'::uuid,'e0000000-0000-4000-8000-000000000002'::uuid,'visit https://spam.example')$$,
  '%outfit_comments_body_check%',
  'V1 Outfit comments reject external links'
);
reset role;

update public.profiles set avatar_url='e0000000-0000-4000-8000-000000000002/profile-old.webp' where id='e0000000-0000-4000-8000-000000000002'::uuid;

set local request.jwt.claim.sub='';
set local request.jwt.claim.role='anon';
set local role anon;
select is(
  (select count(*) from public.outfit_posts where id='e5000000-0000-4000-8000-000000000001'::uuid),
  1::bigint,
  'logged-out visitors can read a published Outfit'
);
select is(has_table_privilege('anon','public.profiles','SELECT'),false,'logged-out Outfit access does not make the profiles table public');
select is(has_table_privilege('anon','public.outfit_comments','SELECT'),false,'logged-out comments use a safe projection instead of direct comment-table access');
select is(
  (select username from public.get_public_outfit_creator('e5000000-0000-4000-8000-000000000001'::uuid)),
  'outfit_a',
  'public Outfit creator projection exposes the published creator handle'
);
select is(
  (select count(*) from public.get_public_outfit_comments('e5000000-0000-4000-8000-000000000001'::uuid,200)),
  1::bigint,
  'logged-out visitors can read the visible comment thread through the safe projection'
);
select is(
  (select username from public.get_public_outfit_comments('e5000000-0000-4000-8000-000000000001'::uuid,200) limit 1),
  'outfit_b',
  'public comment projection exposes display identity without exposing profile-table access'
);
select is(
  (select avatar_url from public.get_public_outfit_comments('e5000000-0000-4000-8000-000000000001'::uuid,200) limit 1),
  'e0000000-0000-4000-8000-000000000002/profile-old.webp',
  'old comments resolve the commenter current profile photo instead of a comment snapshot'
);
select is(
  (select product_name from public.get_public_outfit_product_teasers('e5000000-0000-4000-8000-000000000001'::uuid) limit 1),
  'Integration Jeans',
  'logged-out garment teaser exposes canonical Product identity without Fit details'
);
select is(has_table_privilege('anon','public.outfit_post_items','SELECT'),false,'logged-out visitors cannot directly read Outfit-to-Closet links');
select public.record_outfit_view('e5000000-0000-4000-8000-000000000001'::uuid);
select public.record_outfit_share('e5000000-0000-4000-8000-000000000001'::uuid);
reset role;

update public.profiles set avatar_url='e0000000-0000-4000-8000-000000000002/profile-new.webp' where id='e0000000-0000-4000-8000-000000000002'::uuid;
select is(
  (select avatar_url from public.get_public_outfit_comments('e5000000-0000-4000-8000-000000000001'::uuid,200) limit 1),
  'e0000000-0000-4000-8000-000000000002/profile-new.webp',
  'changing a profile photo updates existing comment identity without changing the comment'
);
select is(
  (select public from storage.buckets where id='profile-photos'),
  true,
  'uploaded profile photos are public identity objects'
);

select is(
  (select view_count from public.outfit_posts where id='e5000000-0000-4000-8000-000000000001'::uuid),
  1,
  'creator analytics record a public Outfit view'
);
select is(
  (select share_count from public.outfit_posts where id='e5000000-0000-4000-8000-000000000001'::uuid),
  1,
  'creator analytics record use of the Outfit share action'
);

set local role authenticated;
set local request.jwt.claim.sub='e0000000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
select public.block_member('e0000000-0000-4000-8000-000000000001'::uuid);
select is(
  (select count(*) from public.follows where follower_id='e0000000-0000-4000-8000-000000000002'::uuid and followed_id='e0000000-0000-4000-8000-000000000001'::uuid),
  0::bigint,
  'blocking removes the existing follow relationship'
);
select is(
  (select count(*) from public.outfit_posts where id='e5000000-0000-4000-8000-000000000001'::uuid),
  0::bigint,
  'a signed-in blocked member no longer sees the creator Outfit'
);
select is(
  (select count(*) from public.get_public_outfit_creator('e5000000-0000-4000-8000-000000000001'::uuid)),
  0::bigint,
  'safe creator projection respects the signed-in block boundary'
);
reset role;

set local request.jwt.claim.sub='';
set local request.jwt.claim.role='anon';
set local role anon;
select is(
  (select count(*) from public.outfit_posts where id='e5000000-0000-4000-8000-000000000001'::uuid),
  1::bigint,
  'a signed-in member block does not make an otherwise public Outfit disappear from anonymous web access'
);
select is(
  (select count(*) from public.get_public_outfit_comments('e5000000-0000-4000-8000-000000000001'::uuid,200)),
  1::bigint,
  'anonymous public comment reading remains available on the published Outfit'
);
reset role;

select * from finish();
rollback;
