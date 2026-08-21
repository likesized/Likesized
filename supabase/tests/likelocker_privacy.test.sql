begin;
select plan(11);

select has_table('public','fit_twin_settings','Fit Twin setting exists');
select has_table('public','product_likes','Product likes exist');
select has_table('public','wish_locker_items','Wish Locker exists');
select policies_are('public','product_likes',array['Members read their product likes','Members create their product likes','Members remove their product likes']);
select policies_are('public','wish_locker_items',array['Members read their Wish Locker','Members add to their Wish Locker','Members remove from their Wish Locker']);
select col_default_is('public','fit_twin_settings','threshold_percent','85','Fit Twin threshold defaults to 85');
select col_is_pk('public','product_likes',array['user_id','product_id'],'Product likes cannot duplicate');
select col_is_pk('public','wish_locker_items',array['user_id','product_id'],'Wish Locker cannot duplicate');
select isnt_empty('select 1 from pg_class where oid=''public.product_likes''::regclass and relrowsecurity','Product likes use RLS');
select isnt_empty('select 1 from pg_class where oid=''public.wish_locker_items''::regclass and relrowsecurity','Wish Locker uses RLS');
select isnt_empty('select 1 from public.fit_twin_settings where singleton and threshold_percent=85','Initial threshold is 85');

select * from finish();
rollback;
