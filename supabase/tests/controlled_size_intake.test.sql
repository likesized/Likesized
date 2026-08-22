begin;

create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions,auth,private;
select plan(10);

select ok(
  exists(select 1 from unnest(enum_range(null::public.garment_size_kind)) value where value::text='not_sure'),
  'Garment size kind has an explicit Not sure state separate from Other'
);
select is(
  public.parse_garment_size('Not sure','not_sure'::public.garment_size_kind,null)->>'normalized_key',
  'not_sure',
  'Top-level Not sure has one canonical normalized size key'
);
select is(
  public.parse_garment_size('32×?','waist_inseam'::public.garment_size_kind,null)->>'normalized_key',
  'waist_inseam:32:?',
  'Waist/inseam preserves a known waist with an unknown inseam'
);
select ok(
  public.parse_garment_size('32×?','waist_inseam'::public.garment_size_kind,null)->'inseam_size'='null'::jsonb,
  'Unknown inseam stays null instead of inventing a number'
);
select is(
  public.parse_garment_size('15.5 / 34-35','dress_shirt'::public.garment_size_kind,null)->>'display_label',
  '15.5 / 34-35',
  'Dress/work shirt stores a controlled collar and sleeve range'
);
select is(
  public.parse_garment_size('? / 34-35','dress_shirt'::public.garment_size_kind,null)->>'normalized_key',
  'dress_shirt:?:34:35',
  'Dress/work shirt allows Not sure for one controlled component'
);
select is(
  public.parse_garment_size('40?','jacket'::public.garment_size_kind,null)->>'normalized_key',
  'jacket:40:?',
  'Jacket size can preserve a known chest size with unknown length designation'
);
select is(
  public.parse_garment_size('?D','bra'::public.garment_size_kind,'US')->>'normalized_key',
  'bra:US:?:D',
  'Bra size can preserve a known cup with unknown band'
);
select is(
  public.parse_garment_size('9','shoe'::public.garment_size_kind,'?')->>'normalized_key',
  'shoe:?:9',
  'Shoe size can preserve a fixed size when the sizing system is Not sure'
);
select is(
  public.parse_garment_size('Brand 2P','freeform'::public.garment_size_kind,null)->>'display_label',
  'Brand 2P',
  'Other remains free-form and preserves the entered manufacturer size for later analysis'
);

select * from finish();
rollback;
