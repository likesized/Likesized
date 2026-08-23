-- Owner-approved acquisition context is one observation per Fit Report.
-- It is personal report context, not reusable Product truth.
create table public.fit_report_purchase_context (
  fit_report_id uuid primary key references public.fit_reports(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  retailer_text text,
  retailer_normalized text,
  retailer_id uuid references public.retailers(id) on delete set null,
  price_paid numeric(10,2),
  purchase_method text,
  purchase_month smallint,
  purchase_year smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fit_report_purchase_context_retailer_text_length check (retailer_text is null or char_length(retailer_text) between 1 and 160),
  constraint fit_report_purchase_context_retailer_normalized_length check (retailer_normalized is null or char_length(retailer_normalized) between 1 and 160),
  constraint fit_report_purchase_context_price check (price_paid is null or (price_paid >= 0 and price_paid <= 999999.99)),
  constraint fit_report_purchase_context_method check (purchase_method is null or purchase_method in ('online', 'in_store', 'gift')),
  constraint fit_report_purchase_context_month check (purchase_month is null or purchase_month between 1 and 12),
  constraint fit_report_purchase_context_year check (purchase_year is null or purchase_year between 1900 and 2100),
  constraint fit_report_purchase_context_date_pair check ((purchase_month is null) = (purchase_year is null))
);

create index fit_report_purchase_context_user_idx on public.fit_report_purchase_context(user_id);
create index fit_report_purchase_context_retailer_idx on public.fit_report_purchase_context(retailer_id) where retailer_id is not null;
create index fit_report_purchase_context_retailer_normalized_idx on public.fit_report_purchase_context(retailer_normalized) where retailer_normalized is not null;
create index fit_report_purchase_context_method_idx on public.fit_report_purchase_context(purchase_method) where purchase_method is not null;
create index fit_report_purchase_context_purchase_date_idx on public.fit_report_purchase_context(purchase_year, purchase_month) where purchase_year is not null;

alter table public.fit_report_purchase_context enable row level security;
revoke all on public.fit_report_purchase_context from anon;
grant select, insert, update on public.fit_report_purchase_context to authenticated;

create policy "owner reads purchase context"
on public.fit_report_purchase_context
for select
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.fit_reports fr
    where fr.id = fit_report_purchase_context.fit_report_id
      and fr.user_id = (select auth.uid())
  )
);

create policy "owner inserts purchase context"
on public.fit_report_purchase_context
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.fit_reports fr
    where fr.id = fit_report_purchase_context.fit_report_id
      and fr.user_id = (select auth.uid())
  )
);

create policy "owner updates purchase context"
on public.fit_report_purchase_context
for update
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.fit_reports fr
    where fr.id = fit_report_purchase_context.fit_report_id
      and fr.user_id = (select auth.uid())
  )
)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.fit_reports fr
    where fr.id = fit_report_purchase_context.fit_report_id
      and fr.user_id = (select auth.uid())
  )
);

-- Sleepwear & Lingerie intake taxonomy. Sleep Shirt is intentionally not included.
insert into public.garment_types (key, label, category, match_profile_key, active, sort_order, intake_active)
values
  ('pajama_pants', 'Pajama pants', 'sleepwear_lingerie', 'bottoms_default', true, 570, true),
  ('pajama_shorts', 'Pajama shorts', 'sleepwear_lingerie', 'bottoms_default', true, 580, true),
  ('pajama_set', 'Pajama set', 'sleepwear_lingerie', 'one_piece', true, 590, true),
  ('nightgown', 'Nightgown', 'sleepwear_lingerie', 'one_piece', true, 600, true),
  ('robe', 'Robe', 'sleepwear_lingerie', 'one_piece', true, 610, true),
  ('chemise', 'Chemise', 'sleepwear_lingerie', 'one_piece', true, 620, true),
  ('babydoll', 'Babydoll', 'sleepwear_lingerie', 'one_piece', true, 630, true),
  ('teddy', 'Teddy', 'sleepwear_lingerie', 'one_piece', true, 640, true),
  ('corset_bustier', 'Corset & bustier', 'sleepwear_lingerie', 'one_piece', true, 650, true),
  ('costume_lingerie', 'Costume lingerie', 'sleepwear_lingerie', 'one_piece', true, 660, true)
on conflict (key) do update set
  label = excluded.label,
  category = excluded.category,
  match_profile_key = excluded.match_profile_key,
  active = excluded.active,
  sort_order = excluded.sort_order,
  intake_active = excluded.intake_active;

insert into public.garment_attribute_definitions (key, label, category, sort_order)
values
  ('waistband', 'Waistband', 'sleepwear_lingerie', 2000),
  ('bottom_style', 'Bottom style', 'sleepwear_lingerie', 2010),
  ('top_closure', 'Top closure', 'sleepwear_lingerie', 2020),
  ('bust_support', 'Bust support', 'sleepwear_lingerie', 2030),
  ('top_strap', 'Top / strap', 'sleepwear_lingerie', 2040),
  ('underbust_fit', 'Underbust fit', 'sleepwear_lingerie', 2050),
  ('garment_form', 'Garment form', 'sleepwear_lingerie', 2060),
  ('lingerie_top_style', 'Top style', 'sleepwear_lingerie', 2070),
  ('lingerie_bottom_style', 'Bottom style', 'sleepwear_lingerie', 2080),
  ('structure_support', 'Structure / Support', 'sleepwear_lingerie', 2090),
  ('corset_style', 'Style', 'sleepwear_lingerie', 2100),
  ('corset_structure', 'Structure', 'sleepwear_lingerie', 2110)
on conflict (key) do update set
  label = excluded.label,
  category = excluded.category,
  sort_order = excluded.sort_order;

-- Existing shared attribute keys gain only the options needed by the new controlled types.
insert into public.garment_attribute_options (attribute_key, option_key, label, sort_order)
values
  ('shape', 'regular', 'Regular', 2120),
  ('top_sleeve', 'spaghetti_strap', 'Spaghetti strap', 2130),
  ('bottom_coverage', 'full', 'Full', 2140),
  ('closure', 'snap', 'Snap', 2150),
  ('closure', 'lace_up', 'Lace-up', 2160),
  ('closure', 'hook_eye', 'Hook & eye', 2170),
  ('closure', 'front_busk', 'Front busk', 2180),
  ('length_profile', 'longline', 'Longline', 2190),

  ('waistband', 'elastic', 'Elastic', 2200),
  ('waistband', 'drawstring', 'Drawstring', 2210),
  ('waistband', 'button_fly', 'Button / fly', 2220),

  ('bottom_style', 'pants', 'Pants', 2230),
  ('bottom_style', 'shorts', 'Shorts', 2240),

  ('top_closure', 'pullover', 'Pullover', 2250),
  ('top_closure', 'button', 'Button', 2260),
  ('top_closure', 'zip', 'Zip', 2270),

  ('bust_support', 'none', 'None', 2280),
  ('bust_support', 'light', 'Light', 2290),
  ('bust_support', 'structured', 'Structured', 2300),

  ('top_strap', 'spaghetti_strap', 'Spaghetti strap', 2310),
  ('top_strap', 'halter', 'Halter', 2320),
  ('top_strap', 'sleeveless', 'Sleeveless', 2330),
  ('top_strap', 'short', 'Short sleeve', 2340),

  ('underbust_fit', 'loose', 'Loose', 2350),
  ('underbust_fit', 'elastic', 'Elastic', 2360),
  ('underbust_fit', 'fitted', 'Fitted', 2370),

  ('garment_form', 'one_piece', 'One-piece', 2380),
  ('garment_form', 'two_piece_set', 'Two-piece set', 2390),
  ('garment_form', 'multi_piece_set', 'Multi-piece set', 2400),

  ('lingerie_top_style', 'bra', 'Bra', 2410),
  ('lingerie_top_style', 'bralette', 'Bralette', 2420),
  ('lingerie_top_style', 'corset_bustier', 'Corset or bustier', 2430),
  ('lingerie_top_style', 'cami_top', 'Cami or top', 2440),
  ('lingerie_top_style', 'halter', 'Halter', 2450),
  ('lingerie_top_style', 'dress_style', 'Dress-style', 2460),
  ('lingerie_top_style', 'no_separate_top', 'No separate top', 2470),

  ('lingerie_bottom_style', 'thong', 'Thong', 2480),
  ('lingerie_bottom_style', 'brief', 'Brief', 2490),
  ('lingerie_bottom_style', 'shorts', 'Shorts', 2500),
  ('lingerie_bottom_style', 'skirt', 'Skirt', 2510),
  ('lingerie_bottom_style', 'garter_style', 'Garter-style', 2520),
  ('lingerie_bottom_style', 'no_separate_bottom', 'No separate bottom', 2530),

  ('structure_support', 'soft_stretchy', 'Soft / Stretchy', 2540),
  ('structure_support', 'light_support', 'Light Support', 2550),
  ('structure_support', 'structured', 'Structured', 2560),
  ('structure_support', 'boned', 'Boned', 2570),

  ('corset_style', 'corset', 'Corset', 2580),
  ('corset_style', 'bustier', 'Bustier', 2590),
  ('corset_style', 'longline_bustier', 'Longline bustier', 2600),

  ('corset_structure', 'soft', 'Soft', 2610),
  ('corset_structure', 'boned', 'Boned', 2620)
on conflict (attribute_key, option_key) do update set
  label = excluded.label,
  sort_order = excluded.sort_order;
