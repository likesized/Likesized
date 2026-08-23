begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions, auth;

select plan(42);

insert into auth.users(id,aud,role,email,created_at,updated_at)
values
  ('fc500000-0000-4000-8000-000000000001'::uuid,'authenticated','authenticated','search-viewer@likesized.test',now(),now()),
  ('fc500000-0000-4000-8000-000000000002'::uuid,'authenticated','authenticated','search-alex@likesized.test',now(),now()),
  ('fc500000-0000-4000-8000-000000000003'::uuid,'authenticated','authenticated','search-other@likesized.test',now(),now());

set local role authenticated;
set local request.jwt.claim.sub='fc500000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select public.save_fit_profile('search_viewer','metric','[{"measurement_type_key":"height","entered_value":170,"entered_unit":"cm","source":"manual","method":"tape"},{"measurement_type_key":"natural_waist","entered_value":80,"entered_unit":"cm","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb);
update public.profiles set display_name='Search Viewer' where id='fc500000-0000-4000-8000-000000000001'::uuid;
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fc500000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
select public.save_fit_profile('alex_fit','metric','[{"measurement_type_key":"height","entered_value":171,"entered_unit":"cm","source":"manual","method":"tape"},{"measurement_type_key":"natural_waist","entered_value":81,"entered_unit":"cm","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb);
update public.profiles set display_name='Alex Example' where id='fc500000-0000-4000-8000-000000000002'::uuid;
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fc500000-0000-4000-8000-000000000003';
set local request.jwt.claim.role='authenticated';
select public.save_fit_profile('style_scout','metric','[{"measurement_type_key":"height","entered_value":188,"entered_unit":"cm","source":"manual","method":"tape"},{"measurement_type_key":"natural_waist","entered_value":100,"entered_unit":"cm","source":"manual","method":"tape"}]'::jsonb,'[]'::jsonb);
update public.profiles set display_name='Style Scout' where id='fc500000-0000-4000-8000-000000000003'::uuid;
reset role;

insert into public.brands(id,name,slug,normalized_name)
values
 ('fc510000-0000-4000-8000-000000000001'::uuid,'Levi Strauss & Co','levi-strauss','levistraussco'),
 ('fc510000-0000-4000-8000-000000000002'::uuid,'Other Works','other-works','otherworks');
insert into public.brand_aliases(id,brand_id,alias,normalized_alias)
values('fc511000-0000-4000-8000-000000000001'::uuid,'fc510000-0000-4000-8000-000000000001'::uuid,'Levi''s','levis');

insert into public.products(id,brand_id,name,slug,category,normalized_name,garment_type_key,market_segment,manufacturer_style_number,manufacturer_style_normalized)
values
 ('fc520000-0000-4000-8000-000000000001'::uuid,'fc510000-0000-4000-8000-000000000001'::uuid,'Ribcage Straight Jeans','levi-ribcage-straight-jeans','bottoms','ribcagestraightjeans','jeans','womens','A123-45','A12345'),
 ('fc520000-0000-4000-8000-000000000002'::uuid,'fc510000-0000-4000-8000-000000000002'::uuid,'Utility Work Jeans','other-utility-work-jeans','bottoms','utilityworkjeans','jeans','unisex','OTHER-1','OTHER1');

insert into public.product_identifiers(id,product_id,identifier_type,original_value,normalized_value)
values
 ('fc521000-0000-4000-8000-000000000001'::uuid,'fc520000-0000-4000-8000-000000000001'::uuid,'sku','SKU-77.88','SKU7788'),
 ('fc521000-0000-4000-8000-000000000002'::uuid,'fc520000-0000-4000-8000-000000000001'::uuid,'upc','012345678901','012345678901');

insert into public.retailers(id,name,normalized_name,domain)
values('fc522000-0000-4000-8000-000000000001'::uuid,'Shop Test','shoptest','shop.test');
insert into public.retailer_listings(id,product_id,retailer_id,retailer_product_id,retailer_product_id_normalized,sku,sku_normalized,listing_title)
values('fc523000-0000-4000-8000-000000000001'::uuid,'fc520000-0000-4000-8000-000000000001'::uuid,'fc522000-0000-4000-8000-000000000001'::uuid,'RET-99','RET99','SKU-RETAIL','SKURETAIL','Ribcage High Rise Straight');

insert into public.outfit_posts(id,user_id,caption,photo_url)
values('fc524000-0000-4000-8000-000000000001'::uuid,'fc500000-0000-4000-8000-000000000003'::uuid,'Ribcage weekend look','fc500000-0000-4000-8000-000000000003/fc524000-0000-4000-8000-000000000001/display.webp');

set local role authenticated;
set local request.jwt.claim.sub='fc500000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';

select is((select id from public.search_catalog_products('Ribcage',24) limit 1),'fc520000-0000-4000-8000-000000000001'::uuid,'catalog search finds product by product name');
select is((select id from public.search_catalog_products('Levi Strauss',24) limit 1),'fc520000-0000-4000-8000-000000000001'::uuid,'catalog search finds product by canonical brand name');
select is((select id from public.search_catalog_products('Levi''s',24) limit 1),'fc520000-0000-4000-8000-000000000001'::uuid,'catalog search finds product through canonical brand alias');
select is((select id from public.search_catalog_products('A123-45',24) limit 1),'fc520000-0000-4000-8000-000000000001'::uuid,'catalog search finds product by manufacturer style with punctuation');
select is((select id from public.search_catalog_products('A12345',24) limit 1),'fc520000-0000-4000-8000-000000000001'::uuid,'catalog search finds product by normalized manufacturer style');
select is((select id from public.search_catalog_products('SKU-77.88',24) limit 1),'fc520000-0000-4000-8000-000000000001'::uuid,'catalog search finds product by stored SKU formatting');
select is((select id from public.search_catalog_products('SKU7788',24) limit 1),'fc520000-0000-4000-8000-000000000001'::uuid,'catalog search finds product by normalized SKU');
select is((select id from public.search_catalog_products('012345678901',24) limit 1),'fc520000-0000-4000-8000-000000000001'::uuid,'catalog search finds product by UPC');
select is((select id from public.search_catalog_products('RET99',24) limit 1),'fc520000-0000-4000-8000-000000000001'::uuid,'catalog search finds product by retailer product ID');
select is((select id from public.search_catalog_products('SKU-RETAIL',24) limit 1),'fc520000-0000-4000-8000-000000000001'::uuid,'catalog search finds product by retailer SKU');
select is((select id from public.search_catalog_products('High Rise Straight',24) limit 1),'fc520000-0000-4000-8000-000000000001'::uuid,'catalog search finds product by retailer listing title');
select is((select count(*) from public.search_catalog_products('nothing-like-this',24)),0::bigint,'unmatched catalog query returns no products');
select is((select count(*) from public.search_catalog_products('SKU',24) where id='fc520000-0000-4000-8000-000000000001'::uuid),1::bigint,'catalog search deduplicates one canonical Product reached through multiple identity records');
select is((select brand_name from public.search_catalog_products('Ribcage',24) limit 1),'Levi Strauss & Co','catalog search returns safe canonical brand display name');
select is((select slug from public.search_catalog_products('Ribcage',24) limit 1),'levi-ribcage-straight-jeans','catalog search returns canonical product slug used by UI navigation');
select is((select total_count from public.search_catalog_products('Ribcage',5) limit 1),1::bigint,'catalog search returns the exact Garments group count independently of suggestion limit');

select is((select id from public.search_members('alex_fit',24) limit 1),'fc500000-0000-4000-8000-000000000002'::uuid,'member search finds exact username');
select is((select id from public.search_members('alex',24) limit 1),'fc500000-0000-4000-8000-000000000002'::uuid,'member search finds username substring');
select is((select id from public.search_members('Alex Example',24) limit 1),'fc500000-0000-4000-8000-000000000002'::uuid,'member search finds display name');
select is((select count(*) from public.search_members('search_viewer',24)),0::bigint,'member search excludes the current viewer');
select is((select count(*) from public.search_members('nobody-here',24)),0::bigint,'unmatched member query returns no profiles');
select is((select id from public.search_members('aLeX eXaMpLe',24) limit 1),'fc500000-0000-4000-8000-000000000002'::uuid,'member search is case-insensitive');
select is((select total_count from public.search_members('alex',5) limit 1),1::bigint,'member search returns the exact People group count');
select is((select id from public.search_outfits('weekend',5) limit 1),'fc524000-0000-4000-8000-000000000001'::uuid,'Outfit search finds a matching caption');
select is((select total_count from public.search_outfits('Ribcage',5) limit 1),1::bigint,'Outfit search returns the exact Outfits group count');
select is((select count(*) from public.get_fit_matches('overall',100) where user_id='fc500000-0000-4000-8000-000000000002'::uuid),0::bigint,'member search does not bypass minimum Fit Match evidence requirements');
select is((select count(*) from public.profiles where id='fc500000-0000-4000-8000-000000000002'::uuid),1::bigint,'signed-in member can open discovered member profile');
select is((select count(*) from public.body_measurements where user_id='fc500000-0000-4000-8000-000000000002'::uuid),0::bigint,'member discovery does not grant raw body measurement access');
select lives_ok($$insert into public.follows(follower_id,followed_id) values('fc500000-0000-4000-8000-000000000001'::uuid,'fc500000-0000-4000-8000-000000000002'::uuid)$$,'discovered member can be followed through the canonical Following relationship');
select is((select count(*) from public.follows where follower_id='fc500000-0000-4000-8000-000000000001'::uuid and followed_id='fc500000-0000-4000-8000-000000000002'::uuid),1::bigint,'search/profile Follow uses the same canonical relationship as People My Size');
select is((select count(*) from public.get_following_notification_subscriptions() where followed_id='fc500000-0000-4000-8000-000000000002'::uuid),0::bigint,'Follow alone does not opt the member into person notifications');
select is(public.set_following_notification_subscription('fc500000-0000-4000-8000-000000000002'::uuid,true),true,'explicit person-bell opt-in enables notifications for the followed member');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fc500000-0000-4000-8000-000000000002';
set local request.jwt.claim.role='authenticated';
select lives_ok($$insert into public.closet_items(id,user_id,product_id,size_label,visibility,wears_count) values('fc530000-0000-4000-8000-000000000001'::uuid,'fc500000-0000-4000-8000-000000000002'::uuid,'fc520000-0000-4000-8000-000000000001'::uuid,'29','shared',0)$$,'discovered followed member can add Shared garment evidence');
select lives_ok($$
 insert into public.fit_reports(id,user_id,closet_item_id,product_id,fit_profile_version_id,size_label,fit,fit_notes)
 select 'fc540000-0000-4000-8000-000000000001'::uuid,'fc500000-0000-4000-8000-000000000002'::uuid,'fc530000-0000-4000-8000-000000000001'::uuid,'fc520000-0000-4000-8000-000000000001'::uuid,current_version_id,'29','just_right','Search loop evidence'
 from public.fit_profiles where user_id='fc500000-0000-4000-8000-000000000002'::uuid
$$,'Shared Fit Report completes discovered-member activity loop');
reset role;

set local role authenticated;
set local request.jwt.claim.sub='fc500000-0000-4000-8000-000000000001';
set local request.jwt.claim.role='authenticated';
select is((select count(*) from public.get_following_feed(50,null) where actor_id='fc500000-0000-4000-8000-000000000002'::uuid),1::bigint,'new Shared activity from searched-and-followed member appears in Following Feed');
select is((select product_slug from public.get_following_feed(50,null) where actor_id='fc500000-0000-4000-8000-000000000002'::uuid limit 1),'levi-ribcage-straight-jeans','Following Feed preserves canonical product navigation from search loop');
select is((select count(*) from public.get_fit_twin_activity_notifications(50,null) where actor_id='fc500000-0000-4000-8000-000000000002'::uuid),1::bigint,'explicitly subscribed followed-member Shared activity creates one person notification');
select is((select actor_id from public.get_fit_twin_activity_notifications(50,null) limit 1),'fc500000-0000-4000-8000-000000000002'::uuid,'notification belongs to the canonical followed member discovered through search');
select is((select id from public.search_members('alex_fit',24) limit 1),'fc500000-0000-4000-8000-000000000002'::uuid,'member remains searchable after being followed');
reset role;

select ok(not has_function_privilege('anon','public.search_catalog_products(text,integer)','EXECUTE'),'anonymous visitors cannot execute authenticated catalog search RPC');
select ok(not has_function_privilege('anon','public.search_members(text,integer)','EXECUTE'),'anonymous visitors cannot execute member search RPC');
select ok(not has_function_privilege('anon','public.search_outfits(text,integer)','EXECUTE'),'anonymous visitors cannot execute Outfit search RPC');

select * from finish();
rollback;
