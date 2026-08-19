-- LikeSized authoritative V1 fit/garment data architecture
-- 2026-08-19. Extends the existing V1 without parallel models.

-- Stop the legacy fixed-column matcher before changing Fit Profile storage.
drop trigger if exists invalidate_fit_matches_after_change on public.fit_profiles;
drop function if exists public.get_fit_matches(public.fit_match_category, integer);
drop function if exists private.calculate_fit_matches(public.fit_match_category, integer);
drop function if exists private.invalidate_fit_matches();

-- New controlled types.
create type public.unit_system as enum ('imperial','metric');
create type public.measurement_unit as enum ('in','cm','lb','kg');
create type public.measurement_source as enum ('manual','imported','device');
create type public.measurement_method as enum ('tape','scale','stated','device','imported','unknown');
create type public.measurement_dimension as enum ('length','weight');
create type public.size_reference_type as enum ('bra','shoe','shirt','pants','dress','other');
create type public.garment_market_segment as enum ('mens','womens','unisex','kids_youth','unknown');
create type public.garment_size_kind as enum (
  'alpha','numeric','waist_inseam','dress_shirt','jacket','bra','shoe',
  'length_designation','freeform'
);
create type public.product_identifier_type as enum (
  'manufacturer_style','sku','upc','barcode','retailer_product_id','other'
);
create type public.closet_visibility as enum ('private','shared');
create type public.evidence_level as enum (
  'exact_variant','exact_product','product_family','similar_garments',
  'brand_garment_type','category_fit'
);

-- Canonical text/identifier normalizers. Original values are always preserved separately.
create or replace function public.normalize_search_text(p_value text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select nullif(regexp_replace(lower(btrim(p_value)), '[^a-z0-9]+', '', 'g'), '');
$$;

create or replace function public.normalize_identifier(p_value text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select nullif(
    regexp_replace(upper(btrim(p_value)), '[[:space:]_.-]+', '', 'g'),
    ''
  );
$$;

-- Fit Profile becomes a core settings/completion row only.
alter table public.profiles
  drop column default_measurement_visibility;

alter table public.fit_profiles
  add column preferred_unit_system public.unit_system not null default 'imperial',
  add column completed_at timestamptz;

alter table public.fit_profiles
  drop column height_in,
  drop column weight_lb,
  drop column chest_in,
  drop column waist_in,
  drop column hips_in,
  drop column inseam_in,
  drop column shoulders_in,
  drop column torso_in,
  drop column shoe_size_us,
  drop column shirt_size,
  drop column pants_waist,
  drop column pants_inseam,
  drop column dress_size;

create table public.measurement_types (
  key text primary key check (key ~ '^[a-z0-9_]+$'),
  label text not null,
  dimension public.measurement_dimension not null,
  canonical_unit public.measurement_unit not null,
  manual_step_imperial numeric(8,4) not null check (manual_step_imperial > 0),
  manual_step_metric numeric(8,4) not null check (manual_step_metric > 0),
  min_canonical numeric(12,6) not null,
  max_canonical numeric(12,6) not null,
  default_tolerance_canonical numeric(12,6) not null check (default_tolerance_canonical > 0),
  core boolean not null default false,
  measurement_group text not null,
  sort_order integer not null default 0,
  check (max_canonical > min_canonical),
  check (
    (dimension = 'length' and canonical_unit = 'cm')
    or (dimension = 'weight' and canonical_unit = 'kg')
  )
);

insert into public.measurement_types
(key,label,dimension,canonical_unit,manual_step_imperial,manual_step_metric,min_canonical,max_canonical,default_tolerance_canonical,core,measurement_group,sort_order)
values
('height','Height','length','cm',0.25,0.5,80,260,12.70,true,'core',10),
('weight','Weight','weight','kg',0.10,0.10,20,350,20.40,true,'core',20),
('chest_circumference','Chest circumference','length','cm',0.25,0.5,40,220,15.24,true,'upper_body',30),
('full_bust','Full bust circumference','length','cm',0.25,0.5,40,220,12.70,true,'upper_body',40),
('high_bust','High / upper bust','length','cm',0.25,0.5,40,220,10.16,false,'upper_body',50),
('underbust','Underbust','length','cm',0.25,0.5,40,180,7.62,false,'upper_body',60),
('overbust','Overbust','length','cm',0.25,0.5,40,220,10.16,false,'upper_body',70),
('natural_waist','Natural waist circumference','length','cm',0.25,0.5,35,220,12.70,true,'lower_body',80),
('lower_pants_waist','Lower / pants waist','length','cm',0.25,0.5,35,220,10.16,false,'lower_body',90),
('high_hip','High hip circumference','length','cm',0.25,0.5,40,230,10.16,false,'lower_body',100),
('full_hip_seat','Full hip / seat circumference','length','cm',0.25,0.5,40,250,12.70,true,'lower_body',110),
('waist_to_hip_length','Waist-to-hip length','length','cm',0.25,0.5,5,60,5.08,false,'lower_body',120),
('inseam','Inseam','length','cm',0.25,0.5,20,130,7.62,true,'lower_body',130),
('shoulder_width','Shoulder-to-shoulder width','length','cm',0.25,0.5,15,80,7.62,true,'upper_body',140),
('individual_shoulder_length','Individual shoulder length','length','cm',0.25,0.5,3,35,3.81,false,'upper_body',150),
('torso_body_length','Torso / body length','length','cm',0.25,0.5,20,120,10.16,true,'torso',160),
('torso_girth','Torso girth','length','cm',0.25,0.5,60,260,12.70,false,'torso',170),
('bust_point_to_bust_point','Bust point to bust point','length','cm',0.25,0.5,5,70,5.08,false,'upper_body',180),
('shoulder_to_bust_point','Shoulder to bust point','length','cm',0.25,0.5,5,80,5.08,false,'upper_body',190),
('front_waist_length','Front waist length','length','cm',0.25,0.5,10,100,7.62,false,'torso',200),
('back_waist_length','Back waist / neck-to-waist length','length','cm',0.25,0.5,10,100,7.62,false,'torso',210),
('shoulder_to_waist','Shoulder to waist','length','cm',0.25,0.5,10,110,7.62,false,'torso',220),
('across_back_width','Across-back width','length','cm',0.25,0.5,10,80,6.35,false,'upper_body',230),
('across_front_chest_width','Across-front / chest width','length','cm',0.25,0.5,10,80,6.35,false,'upper_body',240),
('arm_sleeve_length','Body arm / sleeve length','length','cm',0.25,0.5,20,110,7.62,false,'upper_body',250),
('bicep_upper_arm','Bicep / upper arm circumference','length','cm',0.25,0.5,10,90,6.35,false,'upper_body',260),
('elbow_circumference','Elbow circumference','length','cm',0.25,0.5,10,70,5.08,false,'upper_body',270),
('wrist_circumference','Wrist circumference','length','cm',0.25,0.5,5,50,3.81,false,'upper_body',280),
('neck_collar_circumference','Neck / collar circumference','length','cm',0.25,0.5,15,80,5.08,false,'upper_body',290),
('thigh_circumference','Thigh circumference','length','cm',0.25,0.5,15,120,7.62,false,'lower_body',300),
('knee_circumference','Knee circumference','length','cm',0.25,0.5,10,90,6.35,false,'lower_body',310),
('calf_circumference','Calf circumference','length','cm',0.25,0.5,10,90,6.35,false,'lower_body',320),
('outseam','Outseam','length','cm',0.25,0.5,30,160,10.16,false,'lower_body',330),
('front_rise','Front rise','length','cm',0.25,0.5,10,70,5.08,false,'lower_body',340),
('back_rise','Back rise','length','cm',0.25,0.5,10,90,5.08,false,'lower_body',350),
('crotch_depth','Crotch depth','length','cm',0.25,0.5,5,60,5.08,false,'lower_body',360),
('total_crotch_length','Total crotch length','length','cm',0.25,0.5,20,130,7.62,false,'lower_body',370),
('foot_length','Foot length','length','cm',0.10,0.10,10,40,1.27,false,'foot',380),
('foot_width','Foot width','length','cm',0.10,0.10,3,20,0.76,false,'foot',390);

create table public.body_measurements (
  user_id uuid not null references public.profiles(id) on delete cascade,
  measurement_type_key text not null references public.measurement_types(key),
  entered_value numeric(12,6) not null check (entered_value > 0),
  entered_unit public.measurement_unit not null,
  value_canonical numeric(12,6) not null check (value_canonical > 0),
  source public.measurement_source not null default 'manual',
  method public.measurement_method not null default 'unknown',
  context_note text,
  measured_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, measurement_type_key)
);
create index body_measurements_type_idx on public.body_measurements (measurement_type_key, user_id);

create or replace function private.normalize_body_measurement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  mt public.measurement_types%rowtype;
  v_step numeric;
  v_value numeric;
  v_canonical numeric;
begin
  select * into mt from public.measurement_types where key = new.measurement_type_key;
  if not found then raise exception 'Unknown measurement type'; end if;
  if mt.dimension = 'length' and new.entered_unit not in ('in'::public.measurement_unit, 'cm'::public.measurement_unit) then raise exception 'Length measurement requires inches or centimeters'; end if;
  if mt.dimension = 'weight' and new.entered_unit not in ('lb'::public.measurement_unit, 'kg'::public.measurement_unit) then raise exception 'Weight measurement requires pounds or kilograms'; end if;
  v_value := new.entered_value;
  if new.source = 'manual'::public.measurement_source then
    if new.entered_unit in ('in'::public.measurement_unit, 'lb'::public.measurement_unit) then v_step := mt.manual_step_imperial; else v_step := mt.manual_step_metric; end if;
    v_value := round(v_value / v_step) * v_step;
  end if;
  v_canonical := case new.entered_unit
    when 'in'::public.measurement_unit then v_value * 2.54
    when 'cm'::public.measurement_unit then v_value
    when 'lb'::public.measurement_unit then v_value * 0.45359237
    when 'kg'::public.measurement_unit then v_value
  end;
  if v_canonical < mt.min_canonical or v_canonical > mt.max_canonical then raise exception 'Measurement outside allowed range for %', mt.label; end if;
  new.entered_value := round(v_value, 6);
  new.value_canonical := round(v_canonical, 6);
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.normalize_body_measurement() from public, anon, authenticated;
create trigger normalize_body_measurement_before_write before insert or update on public.body_measurements for each row execute function private.normalize_body_measurement();

create table public.user_size_references (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reference_type public.size_reference_type not null,
  original_size_label text not null,
  sizing_system text,
  band_size numeric(6,2),
  cup_designation text,
  shoe_size numeric(6,2),
  normalized_value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index user_size_references_user_idx on public.user_size_references(user_id, reference_type);

-- Garment-specific match definitions.
create table public.match_profiles (
  key text primary key check (key ~ '^[a-z0-9_]+$'),
  label text not null,
  description text
);
create table public.match_profile_measurements (
  profile_key text not null references public.match_profiles(key) on delete cascade,
  measurement_type_key text not null references public.measurement_types(key),
  weight numeric(8,6) not null check (weight > 0),
  tolerance_override_canonical numeric(12,6) check (tolerance_override_canonical > 0),
  primary key (profile_key, measurement_type_key)
);
insert into public.match_profiles(key,label,description) values
('overall','Overall','General discovery across broad body proportions.'),
('tops_default','Tops','General tops weighting.'),
('bottoms_default','Bottoms','General bottoms weighting.'),
('dresses_default','Dresses','Fitted dress weighting.'),
('work_shirt','Dress / work shirts','Neck, chest, shoulders, sleeve, torso and waist.'),
('bra','Bras','Bust and underbust-led bra matching.'),
('one_piece','One-piece garments','Torso, bust/chest, waist, hips and height.'),
('shoes','Shoes','Foot length and width.');
insert into public.match_profile_measurements(profile_key,measurement_type_key,weight,tolerance_override_canonical) values
('overall','height',0.08,null),('overall','weight',0.04,null),('overall','chest_circumference',0.13,null),('overall','full_bust',0.13,null),('overall','natural_waist',0.14,null),('overall','full_hip_seat',0.14,null),('overall','inseam',0.09,null),('overall','shoulder_width',0.10,null),('overall','torso_body_length',0.08,null),('overall','arm_sleeve_length',0.07,null),
('tops_default','chest_circumference',0.22,null),('tops_default','full_bust',0.22,null),('tops_default','shoulder_width',0.20,null),('tops_default','torso_body_length',0.14,null),('tops_default','arm_sleeve_length',0.12,null),('tops_default','natural_waist',0.10,null),
('bottoms_default','natural_waist',0.10,null),('bottoms_default','lower_pants_waist',0.22,null),('bottoms_default','high_hip',0.12,null),('bottoms_default','full_hip_seat',0.22,null),('bottoms_default','thigh_circumference',0.12,null),('bottoms_default','inseam',0.12,null),('bottoms_default','front_rise',0.05,null),('bottoms_default','back_rise',0.05,null),
('dresses_default','full_bust',0.22,null),('dresses_default','chest_circumference',0.10,null),('dresses_default','natural_waist',0.20,null),('dresses_default','full_hip_seat',0.20,null),('dresses_default','shoulder_width',0.10,null),('dresses_default','torso_body_length',0.10,null),('dresses_default','height',0.08,null),
('work_shirt','neck_collar_circumference',0.20,null),('work_shirt','chest_circumference',0.22,null),('work_shirt','shoulder_width',0.20,null),('work_shirt','arm_sleeve_length',0.18,null),('work_shirt','torso_body_length',0.12,null),('work_shirt','natural_waist',0.08,null),
('bra','full_bust',0.40,null),('bra','underbust',0.40,null),('bra','high_bust',0.20,null),
('one_piece','torso_girth',0.25,null),('one_piece','full_bust',0.18,null),('one_piece','chest_circumference',0.10,null),('one_piece','natural_waist',0.17,null),('one_piece','full_hip_seat',0.18,null),('one_piece','height',0.12,null),
('shoes','foot_length',0.70,null),('shoes','foot_width',0.30,null);

-- Extensible garment taxonomy.
create table public.garment_types (
  key text primary key check (key ~ '^[a-z0-9_]+$'),
  label text not null unique,
  category public.garment_category not null,
  match_profile_key text not null references public.match_profiles(key),
  active boolean not null default true,
  sort_order integer not null default 0
);
insert into public.garment_types(key,label,category,match_profile_key,sort_order) values
('t_shirt','T-shirt','tops','tops_default',10),('polo','Polo','tops','tops_default',20),('dress_shirt','Dress shirt','tops','work_shirt',30),('work_shirt','Work shirt','tops','work_shirt',40),('casual_button_down','Casual button-down','tops','tops_default',50),('blouse','Blouse','tops','tops_default',60),('tank','Tank','tops','tops_default',70),('camisole','Camisole','tops','tops_default',80),('sweater','Sweater','tops','tops_default',90),('sweatshirt','Sweatshirt','tops','tops_default',100),('hoodie','Hoodie','tops','tops_default',110),
('jeans','Jeans','bottoms','bottoms_default',200),('chinos','Chinos','bottoms','bottoms_default',210),('dress_pants','Dress pants','bottoms','bottoms_default',220),('trousers','Trousers','bottoms','bottoms_default',230),('work_pants','Work pants','bottoms','bottoms_default',240),('shorts','Shorts','bottoms','bottoms_default',250),('joggers','Joggers','bottoms','bottoms_default',260),('leggings','Leggings','bottoms','bottoms_default',270),('skirts','Skirts','bottoms','bottoms_default',280),
('dresses','Dresses','dresses','dresses_default',300),('jumpsuits','Jumpsuits','other','one_piece',310),('rompers','Rompers','other','one_piece',320),('bodysuits','Bodysuits','other','one_piece',330),('suit_jackets','Suit jackets','outerwear','tops_default',340),('blazers','Blazers','outerwear','tops_default',350),('jackets','Jackets','outerwear','tops_default',360),('coats','Coats','outerwear','tops_default',370),('activewear','Activewear','other','overall',380),('swimwear','Swimwear','other','one_piece',390),('bras_intimate','Bras / intimate apparel','other','bra',400),('shoes','Shoes','shoes','shoes',500);

-- Optional controlled garment attributes.
create table public.garment_attribute_definitions (
  key text primary key check (key ~ '^[a-z0-9_]+$'),
  label text not null,
  category public.garment_category,
  sort_order integer not null default 0
);
create table public.garment_attribute_options (
  attribute_key text not null references public.garment_attribute_definitions(key) on delete cascade,
  option_key text not null check (option_key ~ '^[a-z0-9_]+$'),
  label text not null,
  sort_order integer not null default 0,
  primary key (attribute_key, option_key)
);
insert into public.garment_attribute_definitions(key,label,category,sort_order) values
('fit_cut','Fit / cut',null,10),('rise','Rise','bottoms',20),('stretch_level','Stretch level',null,30),('sleeve_length','Sleeve length','tops',40),('neckline','Neckline','tops',50),('collar_style','Collar style','tops',60),('construction','Knit / woven',null,70),('length_profile','Length profile',null,80),('leg_shape','Leg shape','bottoms',90);
insert into public.garment_attribute_options(attribute_key,option_key,label,sort_order) values
('fit_cut','skinny','Skinny',10),('fit_cut','slim','Slim',20),('fit_cut','regular','Regular',30),('fit_cut','athletic','Athletic',40),('fit_cut','relaxed','Relaxed',50),('fit_cut','oversized','Oversized',60),('fit_cut','wide','Wide',70),('fit_cut','bootcut','Bootcut',80),('fit_cut','flare','Flare',90),
('rise','low','Low',10),('rise','mid','Mid',20),('rise','high','High',30),
('stretch_level','none','No stretch',10),('stretch_level','low','Low stretch',20),('stretch_level','medium','Medium stretch',30),('stretch_level','high','High stretch',40),
('sleeve_length','sleeveless','Sleeveless',10),('sleeve_length','short','Short sleeve',20),('sleeve_length','three_quarter','3/4 sleeve',30),('sleeve_length','long','Long sleeve',40),
('neckline','crew','Crew',10),('neckline','v_neck','V-neck',20),('neckline','scoop','Scoop',30),('neckline','square','Square',40),('neckline','high','High neck',50),
('collar_style','none','No collar',10),('collar_style','spread','Spread',20),('collar_style','point','Point',30),('collar_style','button_down','Button-down',40),
('construction','knit','Knit',10),('construction','woven','Woven',20),
('length_profile','cropped','Cropped',10),('length_profile','standard','Standard',20),('length_profile','long','Long',30),('length_profile','petite','Petite',40),('length_profile','regular','Regular',50),('length_profile','tall','Tall',60),
('leg_shape','skinny','Skinny',10),('leg_shape','slim','Slim',20),('leg_shape','straight','Straight',30),('leg_shape','relaxed','Relaxed',40),('leg_shape','wide','Wide',50),('leg_shape','bootcut','Bootcut',60),('leg_shape','flare','Flare',70);

create table public.materials (key text primary key check (key ~ '^[a-z0-9_]+$'), label text not null unique);
insert into public.materials(key,label) values ('cotton','Cotton'),('polyester','Polyester'),('elastane','Elastane / Spandex'),('nylon','Nylon'),('wool','Wool'),('linen','Linen'),('rayon','Rayon / Viscose'),('leather','Leather'),('denim','Denim'),('other','Other');

-- Canonical product families, brands, products, listings and identifiers.
alter table public.brands add column normalized_name text;
update public.brands set normalized_name = public.normalize_search_text(name);
alter table public.brands alter column normalized_name set not null;
drop index if exists public.brands_name_ci_uq;
create unique index brands_normalized_name_uq on public.brands(normalized_name);

create table public.brand_aliases (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  alias text not null,
  normalized_alias text not null,
  unique (normalized_alias)
);
create table public.product_families (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id),
  name text not null,
  normalized_name text not null,
  garment_type_key text not null references public.garment_types(key),
  market_segment public.garment_market_segment not null default 'unknown',
  created_at timestamptz not null default now()
);
create unique index product_families_identity_uq on public.product_families(brand_id, normalized_name, garment_type_key, market_segment);

alter table public.products drop column retailer_url;
alter table public.products
  add column normalized_name text,
  add column product_family_id uuid references public.product_families(id),
  add column garment_type_key text references public.garment_types(key),
  add column market_segment public.garment_market_segment not null default 'unknown',
  add column manufacturer_style_number text,
  add column manufacturer_style_normalized text;
update public.products set normalized_name = public.normalize_search_text(name);
alter table public.products alter column normalized_name set not null;
drop index if exists public.products_brand_name_ci_uq;
create unique index products_brand_normalized_identity_uq on public.products(brand_id,normalized_name,coalesce(manufacturer_style_normalized,''));

create table public.retailers (
  id uuid primary key default gen_random_uuid(), name text not null, normalized_name text not null, domain text, created_at timestamptz not null default now()
);
create unique index retailers_normalized_name_uq on public.retailers(normalized_name);
create unique index retailers_domain_uq on public.retailers(lower(domain)) where domain is not null;
create table public.retailer_listings (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  retailer_id uuid references public.retailers(id) on delete set null,
  retailer_product_id text,
  retailer_product_id_normalized text,
  sku text,
  sku_normalized text,
  product_url text,
  normalized_url text,
  listing_title text,
  created_at timestamptz not null default now()
);
create unique index retailer_listings_url_uq on public.retailer_listings(normalized_url) where normalized_url is not null;
create index retailer_listings_product_idx on public.retailer_listings(product_id, retailer_id);
create table public.product_identifiers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  retailer_listing_id uuid references public.retailer_listings(id) on delete cascade,
  retailer_id uuid references public.retailers(id) on delete set null,
  identifier_type public.product_identifier_type not null,
  original_value text not null,
  normalized_value text not null,
  created_at timestamptz not null default now(),
  check (num_nonnulls(product_id, variant_id, retailer_listing_id) >= 1)
);
create unique index product_identifiers_lookup_uq on public.product_identifiers(identifier_type, normalized_value, coalesce(retailer_id,'00000000-0000-0000-0000-000000000000'::uuid));
create index product_identifiers_product_idx on public.product_identifiers(product_id, variant_id);
create table public.product_attribute_values (
  product_id uuid not null references public.products(id) on delete cascade,
  attribute_key text not null,
  option_key text not null,
  primary key (product_id, attribute_key),
  foreign key (attribute_key, option_key) references public.garment_attribute_options(attribute_key, option_key)
);
create index product_attribute_values_option_idx on public.product_attribute_values(attribute_key, option_key, product_id);
create table public.product_materials (
  product_id uuid not null references public.products(id) on delete cascade,
  material_key text not null references public.materials(key),
  percentage numeric(5,2) check (percentage is null or (percentage >= 0 and percentage <= 100)),
  primary key(product_id, material_key)
);

-- Database-enforced normalized catalog fields.
create or replace function private.normalize_brand_row() returns trigger language plpgsql security definer set search_path='' as $$ begin new.normalized_name := public.normalize_search_text(new.name); return new; end; $$;
revoke all on function private.normalize_brand_row() from public,anon,authenticated;
create trigger normalize_brand_before_write before insert or update of name on public.brands for each row execute function private.normalize_brand_row();
create or replace function private.normalize_product_row() returns trigger language plpgsql security definer set search_path='' as $$ begin new.normalized_name := public.normalize_search_text(new.name); new.manufacturer_style_normalized := case when new.manufacturer_style_number is null then null else public.normalize_identifier(new.manufacturer_style_number) end; return new; end; $$;
revoke all on function private.normalize_product_row() from public,anon,authenticated;
create trigger normalize_product_before_write before insert or update of name, manufacturer_style_number on public.products for each row execute function private.normalize_product_row();
create or replace function private.normalize_product_family_row() returns trigger language plpgsql security definer set search_path='' as $$ begin new.normalized_name := public.normalize_search_text(new.name); return new; end; $$;
revoke all on function private.normalize_product_family_row() from public,anon,authenticated;
create trigger normalize_product_family_before_write before insert or update of name on public.product_families for each row execute function private.normalize_product_family_row();
create or replace function private.normalize_retailer_row() returns trigger language plpgsql security definer set search_path='' as $$ begin new.normalized_name := public.normalize_search_text(new.name); new.domain := case when new.domain is null then null else lower(btrim(new.domain)) end; return new; end; $$;
revoke all on function private.normalize_retailer_row() from public,anon,authenticated;
create trigger normalize_retailer_before_write before insert or update of name,domain on public.retailers for each row execute function private.normalize_retailer_row();
create or replace function private.normalize_retailer_listing_row() returns trigger language plpgsql security definer set search_path='' as $$ begin new.retailer_product_id_normalized := case when new.retailer_product_id is null then null else public.normalize_identifier(new.retailer_product_id) end; new.sku_normalized := case when new.sku is null then null else public.normalize_identifier(new.sku) end; if new.product_url is not null and new.normalized_url is null then raise exception 'normalized_url is required when product_url is supplied'; end if; return new; end; $$;
revoke all on function private.normalize_retailer_listing_row() from public,anon,authenticated;
create trigger normalize_retailer_listing_before_write before insert or update on public.retailer_listings for each row execute function private.normalize_retailer_listing_row();
create or replace function private.normalize_product_identifier_row() returns trigger language plpgsql security definer set search_path='' as $$ begin new.normalized_value := public.normalize_identifier(new.original_value); if new.identifier_type='upc'::public.product_identifier_type and (new.normalized_value !~ '^[0-9]+$' or char_length(new.normalized_value) not in (8,12,13,14)) then raise exception 'Invalid UPC format'; end if; return new; end; $$;
revoke all on function private.normalize_product_identifier_row() from public,anon,authenticated;
create trigger normalize_product_identifier_before_write before insert or update of original_value,identifier_type on public.product_identifiers for each row execute function private.normalize_product_identifier_row();
create or replace function private.normalize_variant_row() returns trigger language plpgsql security definer set search_path='' as $$ begin new.color_normalized := case when new.color_label is null then null else public.normalize_search_text(new.color_label) end; return new; end; $$;
revoke all on function private.normalize_variant_row() from public,anon,authenticated;
create trigger normalize_variant_before_write before insert or update of color_label on public.product_variants for each row execute function private.normalize_variant_row();

-- Structured garment sizes. Raw/original size labels remain on variants, Closet items and Fit Reports.
create table public.normalized_sizes (
  id uuid primary key default gen_random_uuid(),
  kind public.garment_size_kind not null,
  normalized_key text not null unique,
  display_label text not null,
  sizing_system text,
  alpha_size text,
  numeric_size numeric(8,2),
  waist_size numeric(8,2),
  inseam_size numeric(8,2),
  length_designation text check (length_designation is null or length_designation in ('short','regular','long','petite','tall')),
  collar_size numeric(8,2),
  sleeve_min numeric(8,2),
  sleeve_max numeric(8,2),
  jacket_chest_size numeric(8,2),
  bra_band integer,
  bra_cup text,
  shoe_size numeric(8,2),
  freeform_normalized text,
  created_at timestamptz not null default now()
);

create or replace function public.parse_garment_size(p_label text,p_kind public.garment_size_kind default null,p_system text default null)
returns jsonb language plpgsql immutable set search_path = '' as $$
declare
  raw text := btrim(coalesce(p_label,'')); compact text; kind public.garment_size_kind := p_kind; a text[]; waist numeric; inseam numeric; collar numeric; sleeve1 numeric; sleeve2 numeric; jacket numeric; band integer; cup text; alpha text; n numeric; length_code text;
begin
  if raw = '' then raise exception 'Size label is required'; end if;
  compact := upper(regexp_replace(replace(replace(raw,'×','X'),'–','-'), '[[:space:]]+', '', 'g'));
  if kind is null then
    if compact ~ '^[0-9]{4}$' then kind := 'waist_inseam';
    elsif compact ~ '^[0-9]+(\.[0-9]+)?/[0-9]+(-[0-9]+)?$' then kind := 'dress_shirt';
    elsif compact ~ '^[0-9]{2,3}[RSL]$' then kind := 'jacket';
    elsif compact ~ '^[0-9]{2,3}[A-Z]{1,3}$' then kind := 'bra';
    elsif compact ~ '^(XXXS|XXS|XS|S|M|L|XL|XXL|XXXL|[0-9]+X(L)?)$' then kind := 'alpha';
    elsif compact ~ '^[0-9]+(\.[0-9]+)?$' then kind := 'numeric';
    else kind := 'freeform'; end if;
  end if;
  if kind = 'waist_inseam' then
    if compact ~ '^[0-9]{4}$' then waist := substring(compact from 1 for 2)::numeric; inseam := substring(compact from 3 for 2)::numeric;
    else a := regexp_match(compact, '^([0-9]+(?:\.[0-9]+)?)[X/]([0-9]+(?:\.[0-9]+)?)$'); if a is null then raise exception 'Invalid waist/inseam size'; end if; waist := a[1]::numeric; inseam := a[2]::numeric; end if;
    return jsonb_build_object('kind','waist_inseam','normalized_key','waist_inseam:'||waist::text||':'||inseam::text,'display_label',waist::text||'×'||inseam::text,'waist_size',waist,'inseam_size',inseam);
  elsif kind = 'dress_shirt' then
    a := regexp_match(compact, '^([0-9]+(?:\.[0-9]+)?)/([0-9]+)(?:-([0-9]+))?$'); if a is null then raise exception 'Invalid dress shirt size'; end if; collar := a[1]::numeric; sleeve1 := a[2]::numeric; sleeve2 := coalesce(a[3]::numeric,sleeve1);
    return jsonb_build_object('kind','dress_shirt','normalized_key','dress_shirt:'||collar::text||':'||sleeve1::text||':'||sleeve2::text,'display_label',collar::text||' / '||sleeve1::text||case when sleeve2<>sleeve1 then '-'||sleeve2::text else '' end,'collar_size',collar,'sleeve_min',sleeve1,'sleeve_max',sleeve2);
  elsif kind = 'jacket' then
    a := regexp_match(compact, '^([0-9]{2,3})([RSL])$'); if a is null then raise exception 'Invalid jacket size'; end if; jacket := a[1]::numeric; length_code := case a[2] when 'S' then 'short' when 'L' then 'long' else 'regular' end;
    return jsonb_build_object('kind','jacket','normalized_key','jacket:'||jacket::text||':'||length_code,'display_label',jacket::text||a[2],'jacket_chest_size',jacket,'length_designation',length_code);
  elsif kind = 'bra' then
    a := regexp_match(compact, '^([0-9]{2,3})([A-Z]{1,3})$'); if a is null then raise exception 'Invalid bra size'; end if; band := a[1]::integer; cup := a[2];
    return jsonb_build_object('kind','bra','normalized_key','bra:'||upper(coalesce(p_system,'US'))||':'||band::text||':'||cup,'display_label',band::text||cup,'bra_band',band,'bra_cup',cup,'sizing_system',upper(coalesce(p_system,'US')));
  elsif kind = 'shoe' then
    if compact !~ '^[0-9]+(\.[0-9]+)?$' then raise exception 'Invalid shoe size'; end if; n := compact::numeric;
    return jsonb_build_object('kind','shoe','normalized_key','shoe:'||upper(coalesce(p_system,'US'))||':'||n::text,'display_label',n::text,'shoe_size',n,'sizing_system',upper(coalesce(p_system,'US')));
  elsif kind = 'alpha' then alpha := compact; return jsonb_build_object('kind','alpha','normalized_key','alpha:'||alpha,'display_label',alpha,'alpha_size',alpha);
  elsif kind = 'numeric' then n := compact::numeric; return jsonb_build_object('kind','numeric','normalized_key','numeric:'||n::text,'display_label',n::text,'numeric_size',n);
  elsif kind = 'length_designation' then length_code := lower(compact); if length_code not in ('short','regular','long','petite','tall') then raise exception 'Invalid length designation'; end if; return jsonb_build_object('kind','length_designation','normalized_key','length:'||length_code,'display_label',initcap(length_code),'length_designation',length_code);
  else return jsonb_build_object('kind','freeform','normalized_key','freeform:'||coalesce(public.normalize_search_text(raw), lower(raw)),'display_label',raw,'freeform_normalized',coalesce(public.normalize_search_text(raw), lower(raw)));
  end if;
end;
$$;

alter table public.product_variants add column normalized_size_id uuid references public.normalized_sizes(id), add column market_segment public.garment_market_segment, add column color_normalized text;
update public.product_variants set color_normalized = public.normalize_search_text(color_label) where color_label is not null;
alter table public.closet_items drop column photo_url;
alter table public.closet_items add column normalized_size_id uuid references public.normalized_sizes(id), add column visibility public.closet_visibility not null default 'private';
alter table public.fit_reports add column normalized_size_id uuid references public.normalized_sizes(id);

alter table public.closet_items drop constraint if exists closet_variant_matches_product_size;
alter table public.fit_reports drop constraint if exists fit_report_variant_matches_product_size;
alter table public.product_variants drop constraint if exists product_variants_identity_uq;
drop index if exists public.product_variants_size_color_uq;
drop index if exists public.closet_items_variant_product_size_idx;
drop index if exists public.fit_reports_variant_product_size_idx;
alter table public.product_variants add constraint product_variants_id_product_uq unique (id, product_id);
alter table public.closet_items add constraint closet_variant_matches_product foreign key (variant_id, product_id) references public.product_variants(id, product_id);
alter table public.fit_reports add constraint fit_report_variant_matches_product foreign key (variant_id, product_id) references public.product_variants(id, product_id);
create unique index product_variants_normalized_identity_uq on public.product_variants(product_id, normalized_size_id, coalesce(color_normalized,'')) where normalized_size_id is not null;
create index closet_items_variant_product_idx on public.closet_items(variant_id, product_id);
create index fit_reports_variant_product_idx on public.fit_reports(variant_id, product_id);

-- Controlled garment-specific Fit Report dimensions.
create table public.fit_dimension_definitions (key text primary key check (key ~ '^[a-z0-9_]+$'), label text not null, response_scale text not null, sort_order integer not null default 0);
create table public.fit_dimension_responses (dimension_key text not null references public.fit_dimension_definitions(key) on delete cascade, response_key text not null check (response_key ~ '^[a-z0-9_]+$'), label text not null, score numeric(5,2), sort_order integer not null default 0, primary key(dimension_key,response_key));
create table public.garment_type_fit_dimensions (garment_type_key text not null references public.garment_types(key) on delete cascade, dimension_key text not null references public.fit_dimension_definitions(key) on delete cascade, sort_order integer not null default 0, primary key(garment_type_key,dimension_key));
create table public.fit_report_dimensions (fit_report_id uuid not null references public.fit_reports(id) on delete cascade, dimension_key text not null, response_key text not null, primary key(fit_report_id,dimension_key), foreign key(dimension_key,response_key) references public.fit_dimension_responses(dimension_key,response_key));
create index fit_report_dimensions_response_idx on public.fit_report_dimensions(dimension_key,response_key);
insert into public.fit_dimension_definitions(key,label,response_scale,sort_order) values
('chest','Chest','fit',10),('bust','Bust','fit',20),('shoulders','Shoulders','fit',30),('torso_body_length','Torso / body length','length',40),('sleeve_fit','Sleeve fit','fit',50),('sleeve_length','Sleeve length','length',60),('waist','Waist','fit',70),('hips_seat','Hips / seat','fit',80),('thigh','Thigh','fit',90),('rise','Rise','position',100),('length_inseam','Length / inseam','length',110),('calf','Calf','fit',120),('overall_length','Overall length','length',130),('collar_neck','Collar / neck','fit',140),('body_length','Body length','length',150),('band_fit','Band fit','fit',160),('cup_fit','Cup fit','fit',170),('coverage','Coverage','coverage',180),('strap_fit','Strap fit','fit',190),('shoe_length','Shoe length','length',200),('shoe_width','Shoe width','fit',210);
insert into public.fit_dimension_responses(dimension_key,response_key,label,score,sort_order) select d.key,r.key,r.label,r.score,r.sort_order from public.fit_dimension_definitions d cross join (values ('too_tight','Too tight',-1.0,10),('snug','Snug',-0.4,20),('just_right','Just right',1.0,30),('relaxed','Relaxed',0.4,40),('too_loose','Too loose',-1.0,50)) as r(key,label,score,sort_order) where d.response_scale='fit';
insert into public.fit_dimension_responses(dimension_key,response_key,label,score,sort_order) select d.key,r.key,r.label,r.score,r.sort_order from public.fit_dimension_definitions d cross join (values ('too_short','Too short',-1.0,10),('slightly_short','Slightly short',-0.4,20),('just_right','Just right',1.0,30),('slightly_long','Slightly long',-0.2,40),('too_long','Too long',-1.0,50)) as r(key,label,score,sort_order) where d.response_scale='length';
insert into public.fit_dimension_responses(dimension_key,response_key,label,score,sort_order) select d.key,r.key,r.label,r.score,r.sort_order from public.fit_dimension_definitions d cross join (values ('too_low','Too low',-1.0,10),('slightly_low','Slightly low',-0.4,20),('just_right','Just right',1.0,30),('slightly_high','Slightly high',-0.4,40),('too_high','Too high',-1.0,50)) as r(key,label,score,sort_order) where d.response_scale='position';
insert into public.fit_dimension_responses(dimension_key,response_key,label,score,sort_order) select d.key,r.key,r.label,r.score,r.sort_order from public.fit_dimension_definitions d cross join (values ('too_little','Too little',-1.0,10),('slightly_low','Slightly low',-0.4,20),('just_right','Just right',1.0,30),('generous','Generous',0.3,40),('too_much','Too much',-1.0,50)) as r(key,label,score,sort_order) where d.response_scale='coverage';
insert into public.garment_type_fit_dimensions(garment_type_key,dimension_key,sort_order) values
('t_shirt','chest',10),('t_shirt','shoulders',20),('t_shirt','torso_body_length',30),('t_shirt','sleeve_fit',40),('t_shirt','waist',50),('polo','chest',10),('polo','shoulders',20),('polo','torso_body_length',30),('polo','sleeve_fit',40),('polo','waist',50),('blouse','bust',10),('blouse','shoulders',20),('blouse','torso_body_length',30),('blouse','sleeve_fit',40),('blouse','waist',50),('dress_shirt','collar_neck',10),('dress_shirt','chest',20),('dress_shirt','shoulders',30),('dress_shirt','sleeve_length',40),('dress_shirt','body_length',50),('dress_shirt','waist',60),('work_shirt','collar_neck',10),('work_shirt','chest',20),('work_shirt','shoulders',30),('work_shirt','sleeve_length',40),('work_shirt','body_length',50),('work_shirt','waist',60),('jeans','waist',10),('jeans','hips_seat',20),('jeans','thigh',30),('jeans','rise',40),('jeans','length_inseam',50),('jeans','calf',60),('chinos','waist',10),('chinos','hips_seat',20),('chinos','thigh',30),('chinos','rise',40),('chinos','length_inseam',50),('dress_pants','waist',10),('dress_pants','hips_seat',20),('dress_pants','thigh',30),('dress_pants','rise',40),('dress_pants','length_inseam',50),('dresses','bust',10),('dresses','waist',20),('dresses','hips_seat',30),('dresses','shoulders',40),('dresses','torso_body_length',50),('dresses','overall_length',60),('bras_intimate','band_fit',10),('bras_intimate','cup_fit',20),('bras_intimate','coverage',30),('bras_intimate','strap_fit',40),('shoes','shoe_length',10),('shoes','shoe_width',20);

-- Shared fit-reference photo metadata. Uploading a fit photo means sharing that Closet item.
create table public.fit_reference_photos (id uuid primary key default gen_random_uuid(), closet_item_id uuid not null unique references public.closet_items(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade, storage_path text not null unique, created_at timestamptz not null default now());
create index fit_reference_photos_user_idx on public.fit_reference_photos(user_id);
alter table public.fit_matches add column coverage_percent smallint check (coverage_percent between 0 and 100);

create or replace function private.clamped_similarity(a numeric,b numeric,tolerance numeric) returns numeric language sql immutable strict set search_path = '' as $$ select greatest(0::numeric, 1 - abs(a - b) / tolerance); $$;
revoke all on function private.clamped_similarity(numeric,numeric,numeric) from public, anon, authenticated;

create or replace function private.calculate_fit_matches_for_profile(p_profile_key text,p_result_limit integer default 30)
returns table (user_id uuid,username text,display_name text,avatar_url text,match_score integer,coverage_percent integer)
language plpgsql security definer set search_path = '' as $$
declare v_user_id uuid := auth.uid(); v_limit integer := least(greatest(coalesce(p_result_limit,30),1),100);
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if not exists (select 1 from public.match_profiles where key=p_profile_key) then raise exception 'Unknown match profile'; end if;
  if not exists (select 1 from public.fit_profiles where user_id=v_user_id and completed_at is not null) then return; end if;
  return query
  with profile_weights as (
    select mpm.measurement_type_key,mpm.weight,coalesce(mpm.tolerance_override_canonical,mt.default_tolerance_canonical) as tolerance
    from public.match_profile_measurements mpm join public.measurement_types mt on mt.key=mpm.measurement_type_key where mpm.profile_key=p_profile_key
  ), total as (select sum(weight) as total_weight from profile_weights), candidates as (
    select p.id,p.username,p.display_name,p.avatar_url from public.profiles p join public.fit_profiles fp on fp.user_id=p.id and fp.completed_at is not null where p.id<>v_user_id and p.username is not null
  ), scored as (
    select c.id,c.username,c.display_name,c.avatar_url,
      sum(case when me.value_canonical is not null and them.value_canonical is not null then private.clamped_similarity(me.value_canonical,them.value_canonical,pw.tolerance)*pw.weight else 0 end) as weighted_similarity,
      sum(case when me.value_canonical is not null and them.value_canonical is not null then pw.weight else 0 end) as shared_weight,
      max(t.total_weight) as total_weight
    from candidates c cross join profile_weights pw cross join total t
    left join public.body_measurements me on me.user_id=v_user_id and me.measurement_type_key=pw.measurement_type_key
    left join public.body_measurements them on them.user_id=c.id and them.measurement_type_key=pw.measurement_type_key
    group by c.id,c.username,c.display_name,c.avatar_url
  )
  select s.id,s.username,s.display_name,s.avatar_url,
    round(least(1::numeric,greatest(0::numeric,s.weighted_similarity/nullif(s.shared_weight,0)))*100)::integer,
    round(least(1::numeric,greatest(0::numeric,s.shared_weight/nullif(s.total_weight,0)))*100)::integer
  from scored s where s.shared_weight>0 order by 5 desc,6 desc,s.username limit v_limit;
end;
$$;
revoke all on function private.calculate_fit_matches_for_profile(text,integer) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.calculate_fit_matches_for_profile(text,integer) to authenticated;

create or replace function public.get_fit_matches(p_match_category public.fit_match_category default 'overall',p_result_limit integer default 30)
returns table (user_id uuid,username text,display_name text,avatar_url text,match_score integer)
language sql security invoker set search_path = '' as $$
  select m.user_id,m.username,m.display_name,m.avatar_url,m.match_score from private.calculate_fit_matches_for_profile(case p_match_category when 'tops'::public.fit_match_category then 'tops_default' when 'bottoms'::public.fit_match_category then 'bottoms_default' else 'overall' end,p_result_limit) m;
$$;
revoke all on function public.get_fit_matches(public.fit_match_category,integer) from public, anon;
grant execute on function public.get_fit_matches(public.fit_match_category,integer) to authenticated;

create or replace function public.get_garment_fit_matches(p_garment_type_key text,p_result_limit integer default 100)
returns table (user_id uuid,username text,display_name text,avatar_url text,match_score integer,coverage_percent integer)
language sql security invoker set search_path = '' as $$
  select m.* from public.garment_types gt cross join lateral private.calculate_fit_matches_for_profile(gt.match_profile_key,p_result_limit) m where gt.key=p_garment_type_key;
$$;
revoke all on function public.get_garment_fit_matches(text,integer) from public, anon;
grant execute on function public.get_garment_fit_matches(text,integer) to authenticated;

create or replace function public.get_product_evidence_candidates(p_product_id uuid,p_variant_id uuid default null,p_result_limit integer default 200)
returns table (fit_report_id uuid,user_id uuid,closet_item_id uuid,evidence_product_id uuid,evidence_variant_id uuid,original_size_label text,normalized_size_id uuid,fit public.fit_rating,would_buy_again boolean,evidence_level public.evidence_level,evidence_rank integer,attribute_overlap integer)
language sql security invoker set search_path = '' as $$
  with target as (select p.* from public.products p where p.id=p_product_id), candidates as (
    select fr.id as fit_report_id,fr.user_id,fr.closet_item_id,fr.product_id as evidence_product_id,fr.variant_id as evidence_variant_id,fr.size_label as original_size_label,fr.normalized_size_id,fr.fit,fr.would_buy_again,ep.brand_id,ep.product_family_id,ep.garment_type_key,ep.category,
      (select count(*)::integer from public.product_attribute_values ta join public.product_attribute_values ea on ea.attribute_key=ta.attribute_key and ea.option_key=ta.option_key where ta.product_id=p_product_id and ea.product_id=ep.id) as attribute_overlap,
      t.brand_id as target_brand_id,t.product_family_id as target_family_id,t.garment_type_key as target_garment_type,t.category as target_category
    from public.fit_reports fr join public.products ep on ep.id=fr.product_id cross join target t
    where fr.product_id=p_product_id or (t.product_family_id is not null and ep.product_family_id=t.product_family_id) or (t.garment_type_key is not null and ep.garment_type_key=t.garment_type_key) or ep.category=t.category
  )
  select c.fit_report_id,c.user_id,c.closet_item_id,c.evidence_product_id,c.evidence_variant_id,c.original_size_label,c.normalized_size_id,c.fit,c.would_buy_again,
    case when p_variant_id is not null and c.evidence_variant_id=p_variant_id then 'exact_variant'::public.evidence_level when c.evidence_product_id=p_product_id then 'exact_product'::public.evidence_level when c.target_family_id is not null and c.product_family_id=c.target_family_id then 'product_family'::public.evidence_level when c.target_garment_type is not null and c.garment_type_key=c.target_garment_type and c.attribute_overlap>0 then 'similar_garments'::public.evidence_level when c.brand_id=c.target_brand_id and c.garment_type_key=c.target_garment_type then 'brand_garment_type'::public.evidence_level else 'category_fit'::public.evidence_level end,
    case when p_variant_id is not null and c.evidence_variant_id=p_variant_id then 1 when c.evidence_product_id=p_product_id then 2 when c.target_family_id is not null and c.product_family_id=c.target_family_id then 3 when c.target_garment_type is not null and c.garment_type_key=c.target_garment_type and c.attribute_overlap>0 then 4 when c.brand_id=c.target_brand_id and c.garment_type_key=c.target_garment_type then 5 else 6 end,
    c.attribute_overlap
  from candidates c order by 11,12 desc,c.fit_report_id limit least(greatest(coalesce(p_result_limit,200),1),500);
$$;
revoke all on function public.get_product_evidence_candidates(uuid,uuid,integer) from public, anon;
grant execute on function public.get_product_evidence_candidates(uuid,uuid,integer) to authenticated;

-- RLS and least-privilege grants.
alter table public.measurement_types enable row level security;
alter table public.body_measurements enable row level security;
alter table public.user_size_references enable row level security;
alter table public.match_profiles enable row level security;
alter table public.match_profile_measurements enable row level security;
alter table public.garment_types enable row level security;
alter table public.garment_attribute_definitions enable row level security;
alter table public.garment_attribute_options enable row level security;
alter table public.materials enable row level security;
alter table public.brand_aliases enable row level security;
alter table public.product_families enable row level security;
alter table public.retailers enable row level security;
alter table public.retailer_listings enable row level security;
alter table public.product_identifiers enable row level security;
alter table public.product_attribute_values enable row level security;
alter table public.product_materials enable row level security;
alter table public.normalized_sizes enable row level security;
alter table public.fit_dimension_definitions enable row level security;
alter table public.fit_dimension_responses enable row level security;
alter table public.garment_type_fit_dimensions enable row level security;
alter table public.fit_report_dimensions enable row level security;
alter table public.fit_reference_photos enable row level security;

create policy "controlled measurement types readable" on public.measurement_types for select to authenticated using (true);
create policy "owner reads body measurements" on public.body_measurements for select to authenticated using ((select auth.uid())=user_id);
create policy "owner inserts body measurements" on public.body_measurements for insert to authenticated with check ((select auth.uid())=user_id);
create policy "owner updates body measurements" on public.body_measurements for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "owner deletes body measurements" on public.body_measurements for delete to authenticated using ((select auth.uid())=user_id);
create policy "owner reads size references" on public.user_size_references for select to authenticated using ((select auth.uid())=user_id);
create policy "owner inserts size references" on public.user_size_references for insert to authenticated with check ((select auth.uid())=user_id);
create policy "owner updates size references" on public.user_size_references for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "owner deletes size references" on public.user_size_references for delete to authenticated using ((select auth.uid())=user_id);
create policy "match profiles readable" on public.match_profiles for select to authenticated using (true);
create policy "match profile measurements readable" on public.match_profile_measurements for select to authenticated using (true);
create policy "garment types readable" on public.garment_types for select to anon,authenticated using (true);
create policy "garment attributes readable" on public.garment_attribute_definitions for select to anon,authenticated using (true);
create policy "garment attribute options readable" on public.garment_attribute_options for select to anon,authenticated using (true);
create policy "materials readable" on public.materials for select to anon,authenticated using (true);
create policy "brand aliases readable" on public.brand_aliases for select to anon,authenticated using (true);
create policy "authenticated add brand alias" on public.brand_aliases for insert to authenticated with check (true);
create policy "product families readable" on public.product_families for select to anon,authenticated using (true);
create policy "authenticated add product family" on public.product_families for insert to authenticated with check (true);
create policy "retailers readable" on public.retailers for select to anon,authenticated using (true);
create policy "authenticated add retailer" on public.retailers for insert to authenticated with check (true);
create policy "retailer listings readable" on public.retailer_listings for select to anon,authenticated using (true);
create policy "authenticated add retailer listing" on public.retailer_listings for insert to authenticated with check (true);
create policy "product identifiers readable" on public.product_identifiers for select to anon,authenticated using (true);
create policy "authenticated add product identifier" on public.product_identifiers for insert to authenticated with check (true);
create policy "product attributes readable" on public.product_attribute_values for select to anon,authenticated using (true);
create policy "authenticated add product attributes" on public.product_attribute_values for insert to authenticated with check (true);
create policy "product materials readable" on public.product_materials for select to anon,authenticated using (true);
create policy "authenticated add product materials" on public.product_materials for insert to authenticated with check (true);
create policy "normalized sizes readable" on public.normalized_sizes for select to anon,authenticated using (true);
create policy "authenticated add normalized sizes" on public.normalized_sizes for insert to authenticated with check (true);
create policy "fit dimensions readable" on public.fit_dimension_definitions for select to authenticated using (true);
create policy "fit responses readable" on public.fit_dimension_responses for select to authenticated using (true);
create policy "garment fit dimensions readable" on public.garment_type_fit_dimensions for select to authenticated using (true);

drop policy if exists "owner reads closet" on public.closet_items;
create policy "owner or members read closet" on public.closet_items for select to authenticated using ((select auth.uid())=user_id or visibility='shared'::public.closet_visibility);

drop policy if exists "owner inserts fit report" on public.fit_reports;
drop policy if exists "owner updates fit report" on public.fit_reports;
create policy "owner inserts fit report" on public.fit_reports for insert to authenticated with check ((select auth.uid())=user_id and exists (select 1 from public.closet_items ci where ci.id=fit_reports.closet_item_id and ci.user_id=(select auth.uid()) and ci.product_id=fit_reports.product_id and ci.variant_id is not distinct from fit_reports.variant_id and ci.normalized_size_id is not distinct from fit_reports.normalized_size_id and ci.size_label=fit_reports.size_label));
create policy "owner updates fit report" on public.fit_reports for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id and exists (select 1 from public.closet_items ci where ci.id=fit_reports.closet_item_id and ci.user_id=(select auth.uid()) and ci.product_id=fit_reports.product_id and ci.variant_id is not distinct from fit_reports.variant_id and ci.normalized_size_id is not distinct from fit_reports.normalized_size_id and ci.size_label=fit_reports.size_label));
drop policy if exists "members read fit reports" on public.fit_reports;
create policy "owner or members read shared fit reports" on public.fit_reports for select to authenticated using ((select auth.uid())=user_id or exists (select 1 from public.closet_items ci where ci.id=fit_reports.closet_item_id and ci.visibility='shared'::public.closet_visibility));
create policy "owner or members read shared fit dimensions" on public.fit_report_dimensions for select to authenticated using (exists (select 1 from public.fit_reports fr where fr.id=fit_report_dimensions.fit_report_id));
create policy "owner inserts fit dimensions" on public.fit_report_dimensions for insert to authenticated with check (exists (select 1 from public.fit_reports fr where fr.id=fit_report_dimensions.fit_report_id and fr.user_id=(select auth.uid())));
create policy "owner updates fit dimensions" on public.fit_report_dimensions for update to authenticated using (exists (select 1 from public.fit_reports fr where fr.id=fit_report_dimensions.fit_report_id and fr.user_id=(select auth.uid()))) with check (exists (select 1 from public.fit_reports fr where fr.id=fit_report_dimensions.fit_report_id and fr.user_id=(select auth.uid())));
create policy "owner deletes fit dimensions" on public.fit_report_dimensions for delete to authenticated using (exists (select 1 from public.fit_reports fr where fr.id=fit_report_dimensions.fit_report_id and fr.user_id=(select auth.uid())));
create policy "owner or members read fit photo metadata" on public.fit_reference_photos for select to authenticated using ((select auth.uid())=user_id or exists (select 1 from public.closet_items ci where ci.id=fit_reference_photos.closet_item_id and ci.visibility='shared'::public.closet_visibility));
create policy "owner inserts fit photo metadata" on public.fit_reference_photos for insert to authenticated with check ((select auth.uid())=user_id and exists (select 1 from public.closet_items ci where ci.id=fit_reference_photos.closet_item_id and ci.user_id=(select auth.uid()) and ci.visibility='shared'::public.closet_visibility));
create policy "owner deletes fit photo metadata" on public.fit_reference_photos for delete to authenticated using ((select auth.uid())=user_id);
drop policy if exists "members read outfit item links" on public.outfit_post_items;
create policy "members read shared outfit item links" on public.outfit_post_items for select to authenticated using (exists (select 1 from public.closet_items ci where ci.id=outfit_post_items.closet_item_id and ci.visibility='shared'::public.closet_visibility));

revoke all on public.measurement_types,public.body_measurements,public.user_size_references,public.match_profiles,public.match_profile_measurements,public.garment_types,public.garment_attribute_definitions,public.garment_attribute_options,public.materials,public.brand_aliases,public.product_families,public.retailers,public.retailer_listings,public.product_identifiers,public.product_attribute_values,public.product_materials,public.normalized_sizes,public.fit_dimension_definitions,public.fit_dimension_responses,public.garment_type_fit_dimensions,public.fit_report_dimensions,public.fit_reference_photos from anon, authenticated;
grant select on public.garment_types,public.garment_attribute_definitions,public.garment_attribute_options,public.materials,public.brand_aliases,public.product_families,public.retailers,public.retailer_listings,public.product_identifiers,public.product_attribute_values,public.product_materials,public.normalized_sizes to anon, authenticated;
grant select on public.measurement_types,public.match_profiles,public.match_profile_measurements,public.fit_dimension_definitions,public.fit_dimension_responses,public.garment_type_fit_dimensions to authenticated;
grant select,insert,update,delete on public.body_measurements,public.user_size_references to authenticated;
grant insert on public.brand_aliases,public.product_families,public.retailers,public.retailer_listings,public.product_identifiers,public.product_attribute_values,public.product_materials,public.normalized_sizes to authenticated;
grant select,insert,update,delete on public.fit_report_dimensions to authenticated;
grant select,insert,delete on public.fit_reference_photos to authenticated;
grant update on public.brands,public.products,public.product_variants to authenticated;

comment on table public.fit_profiles is 'Core Fit Profile settings/completion only. Raw body measurements live in body_measurements.';
comment on table public.body_measurements is 'ALL raw body measurements. Owner-only through RLS; canonical values are normalized for matching.';
comment on table public.user_size_references is 'Owner-only normally worn size references such as bra and shoe size; not public identity data.';
comment on table public.normalized_sizes is 'Logical garment sizes used as matching keys. Original manufacturer labels remain on variants/Closet/Fit Reports.';
comment on table public.fit_reference_photos is 'Optional fit/reference photos. Every stored photo is member-shared and requires a shared Closet item.';
comment on table public.product_families is 'Canonical fit-relevant family grouping across colors/washes/minor releases.';
comment on table public.retailer_listings is 'Retailer-specific listings/URLs for canonical products; URLs are not permanent product identity.';
comment on table public.fit_report_dimensions is 'Controlled garment-specific fit dimensions; no free-text values are used as matching keys.';

-- Fit/reference photo storage: shared to authenticated members, never public internet.
drop policy if exists "owners upload closet photos" on storage.objects;
drop policy if exists "owners read closet photos" on storage.objects;
drop policy if exists "owners update closet photos" on storage.objects;
drop policy if exists "owners delete closet photos" on storage.objects;
-- Supabase protects bucket deletion through SQL. The legacy empty closet-photos bucket remains private but has no access policies and is retired from application use.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('fit-reference-photos','fit-reference-photos',false,8388608,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy "members read shared fit reference photos" on storage.objects for select to authenticated using (bucket_id='fit-reference-photos' and exists (select 1 from public.fit_reference_photos fr join public.closet_items ci on ci.id=fr.closet_item_id where fr.storage_path=storage.objects.name and ci.visibility='shared'::public.closet_visibility));
create policy "owners upload fit reference photos" on storage.objects for insert to authenticated with check (bucket_id='fit-reference-photos' and (storage.foldername(name))[1]=(select auth.uid()::text) and exists (select 1 from public.closet_items ci where ci.user_id=(select auth.uid()) and ci.id::text=(storage.foldername(name))[2] and ci.visibility='shared'::public.closet_visibility));
create policy "owners update fit reference photos" on storage.objects for update to authenticated using (bucket_id='fit-reference-photos' and (storage.foldername(name))[1]=(select auth.uid()::text)) with check (bucket_id='fit-reference-photos' and (storage.foldername(name))[1]=(select auth.uid()::text));
create policy "owners delete fit reference photos" on storage.objects for delete to authenticated using (bucket_id='fit-reference-photos' and (storage.foldername(name))[1]=(select auth.uid()::text));
