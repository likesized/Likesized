-- Reconcile the earlier 150-item provisional Product seed to the owner-locked
-- submission-first controlled-catalog model. The starter list remains launch
-- research/enrichment input, but it is not automatically authoritative Product identity.

create temporary table starter_seed_reclassify(brand_name text,item_name text,garment_type_key text) on commit drop;
insert into starter_seed_reclassify(brand_name,item_name,garment_type_key) values
  ('Levi''s','501 Original','jeans'),
  ('Wrangler','Cowboy Cut','jeans'),
  ('Lee','Rider','jeans'),
  ('American Eagle','Dreamy Drape','jeans'),
  ('Abercrombie & Fitch','Ultra Barrel','jeans'),
  ('Madewell','Perfect Vintage','jeans'),
  ('Gap','Stride','jeans'),
  ('Good American','Good Legs','jeans'),
  ('AGOLDE','Low Curve','jeans'),
  ('PAIGE','Anessa','jeans'),
  ('Citizens of Humanity','Ayla','jeans'),
  ('FRAME','Le Slim Palazzo','jeans'),
  ('Lucky Brand','223 Straight','jeans'),
  ('Old Navy','Wow Jeans','jeans'),
  ('Hollister','Baggy Jeans','jeans'),
  ('Levi''s','XX Chino','chinos'),
  ('Dockers','Ultimate Chino','chinos'),
  ('J.Crew','770 Chino','chinos'),
  ('Bonobos','Stretch Washed Chino','chinos'),
  ('Gap','GapFlex Essential Khaki','chinos'),
  ('Everlane','Performance Chino','chinos'),
  ('Old Navy','Ultimate Tech Chino','chinos'),
  ('lululemon','ABC Trouser','trousers'),
  ('Banana Republic','Traveler Pant','trousers'),
  ('Uniqlo','Smart Ankle Pants','trousers'),
  ('Vuori','Meta Pant','trousers'),
  ('Rhone','Commuter Pant','trousers'),
  ('Dickies','874 Work Pant','trousers'),
  ('Carhartt','Rugged Flex Pant','trousers'),
  ('Abercrombie & Fitch','90s Relaxed Trouser','trousers'),
  ('Nike','Primary Tee','t_shirt'),
  ('adidas','Trefoil Essentials Tee','t_shirt'),
  ('lululemon','Everyday Cotton-Blend T-Shirt','t_shirt'),
  ('Uniqlo','AIRism Cotton T-Shirt','t_shirt'),
  ('Vuori','Strato Tech Tee','t_shirt'),
  ('Rhone','Reign Tee','t_shirt'),
  ('Abercrombie & Fitch','Premium Heavyweight Tee','t_shirt'),
  ('Gap','Heavyweight T-Shirt','t_shirt'),
  ('Old Navy','Soft-Washed T-Shirt','t_shirt'),
  ('Carhartt','K87 Heavyweight T-Shirt','t_shirt'),
  ('Patagonia','Capilene Cool Daily Shirt','t_shirt'),
  ('American Eagle','Super Soft T-Shirt','t_shirt'),
  ('Everlane','Premium-Weight Crew','t_shirt'),
  ('Aritzia','Homestretch T-Shirt','t_shirt'),
  ('SKIMS','Fits Everybody T-Shirt','t_shirt'),
  ('Nike','Club Fleece Hoodie','hoodie'),
  ('adidas','Z.N.E. Hoodie','hoodie'),
  ('lululemon','Steady State Hoodie','hoodie'),
  ('Aritzia','Cozy Fleece Hoodie','hoodie'),
  ('Alo Yoga','Accolade Hoodie','hoodie'),
  ('SKIMS','Cotton Fleece Hoodie','hoodie'),
  ('Abercrombie & Fitch','Essential Popover Hoodie','hoodie'),
  ('Gap','VintageSoft Hoodie','hoodie'),
  ('Old Navy','Dynamic Fleece Hoodie','hoodie'),
  ('Champion','Reverse Weave Hoodie','hoodie'),
  ('Carhartt','Rain Defender Hoodie','hoodie'),
  ('Uniqlo','Sweat Pullover Hoodie','hoodie'),
  ('Vuori','Coronado Hoodie','hoodie'),
  ('American Eagle','Super Soft Hoodie','hoodie'),
  ('Under Armour','Rival Fleece Hoodie','hoodie'),
  ('J.Crew','Secret Wash Shirt','casual_button_down'),
  ('Ralph Lauren','Oxford Shirt','casual_button_down'),
  ('Brooks Brothers','Original Polo Button-Down Oxford','casual_button_down'),
  ('Abercrombie & Fitch','Linen-Blend Button-Up','casual_button_down'),
  ('Gap','Oxford Shirt','casual_button_down'),
  ('Madewell','Oversized Button-Up Shirt','casual_button_down'),
  ('Everlane','Silky Cotton Relaxed Shirt','casual_button_down'),
  ('Uniqlo','Oxford Shirt','casual_button_down'),
  ('American Eagle','Button-Up Shirt','casual_button_down'),
  ('Wrangler','Western Snap Shirt','casual_button_down'),
  ('Banana Republic','Dress Shirt','dress_shirt'),
  ('Free People','We The Free Button-Down','blouse'),
  ('Anthropologie','Maeve Button-Down Shirt','blouse'),
  ('PAIGE','Button-Down Shirt','blouse'),
  ('Carhartt','Rugged Flex Shirt','work_shirt'),
  ('The North Face','Nuptse Jacket','jacket_coat'),
  ('Patagonia','Nano Puff Jacket','jacket_coat'),
  ('Columbia','Powder Lite Jacket','jacket_coat'),
  ('Arc''teryx','Beta Jacket','jacket_coat'),
  ('Carhartt','Detroit Jacket','jacket_coat'),
  ('Levi''s','Trucker Jacket','jacket_coat'),
  ('Alpha Industries','MA-1 Bomber','jacket_coat'),
  ('Barbour','Bedale Jacket','jacket_coat'),
  ('Uniqlo','PUFFTECH Jacket','jacket_coat'),
  ('lululemon','Wunder Puff','jacket_coat'),
  ('Nike','Windrunner Jacket','jacket_coat'),
  ('adidas','Terrex Jacket','jacket_coat'),
  ('Abercrombie & Fitch','Chore Jacket','jacket_coat'),
  ('Gap','Bomber Jacket','jacket_coat'),
  ('Dickies','Eisenhower Jacket','jacket_coat'),
  ('lululemon','Pace Breaker Short','shorts'),
  ('Vuori','Kore Short','shorts'),
  ('Nike','Primary Dri-FIT Short','shorts'),
  ('adidas','Z.N.E. Short','shorts'),
  ('Patagonia','Baggies Shorts','shorts'),
  ('Rhone','Mako Short','shorts'),
  ('Gymshark','Arrival Short','shorts'),
  ('Under Armour','Vanish Woven Short','shorts'),
  ('Alo Yoga','Performance Short','shorts'),
  ('Fabletics','The One Short','shorts'),
  ('Old Navy','StretchTech Short','shorts'),
  ('Abercrombie & Fitch','Saturday Short','shorts'),
  ('American Eagle','AirFlex+ Short','shorts'),
  ('Carhartt','Rugged Flex Short','shorts'),
  ('Columbia','Silver Ridge Short','shorts'),
  ('Abercrombie & Fitch','Giselle Dress','dress'),
  ('Reformation','Tagliatelle Dress','dress'),
  ('Aritzia','Wilfred Dress','dress'),
  ('Free People','Oasis Midi Dress','dress'),
  ('Anthropologie','Somerset Maxi Dress','dress'),
  ('Hill House Home','Ellie Nap Dress','dress'),
  ('House of CB','Carmen Dress','dress'),
  ('SKIMS','Soft Lounge Long Slip Dress','dress'),
  ('J.Crew','Gwyneth Slip Dress','dress'),
  ('Banana Republic','Maxi Dress','dress'),
  ('Madewell','Seamed Midi Dress','dress'),
  ('Gap','Linen-Blend Midi Dress','dress'),
  ('Old Navy','Fit & Flare Dress','dress'),
  ('Zara','Midi Dress','dress'),
  ('H&M','A-Line Dress','dress'),
  ('Nike','Pegasus 42','sneakers'),
  ('adidas','Supernova Rise 3','sneakers'),
  ('New Balance','Fresh Foam X 1080v15','sneakers'),
  ('ASICS','GEL-NIMBUS 28','sneakers'),
  ('Brooks','Ghost 17','sneakers'),
  ('HOKA','Clifton 10','sneakers'),
  ('On','Cloud 6','sneakers'),
  ('Saucony','Endorphin Speed 5','sneakers'),
  ('Puma','Velocity NITRO','sneakers'),
  ('Under Armour','Halo Runner','sneakers'),
  ('Converse','Chuck 70','sneakers'),
  ('Vans','Old Skool','sneakers'),
  ('Reebok','FloatZig','sneakers'),
  ('Salomon','XT-6','sneakers'),
  ('Skechers','Aero','sneakers'),
  ('Timberland','Premium 6-Inch Boot','boots'),
  ('Dr. Martens','1460','boots'),
  ('Blundstone','585','boots'),
  ('Red Wing','Iron Ranger','boots'),
  ('Wolverine','1000 Mile','boots'),
  ('Ariat','WorkHog','boots'),
  ('Tecovas','Cartwright','boots'),
  ('Danner','Mountain 600','boots'),
  ('Thorogood','American Heritage','boots'),
  ('Thursday Boot Company','Captain','boots'),
  ('UGG','Classic Mini','boots'),
  ('Sorel','Caribou','boots'),
  ('Justin Boots','Bent Rail','boots'),
  ('Lucchese','Classic Western Boot','boots'),
  ('Carhartt','Wedge Boot','boots');

insert into public.catalog_candidates(
  identity_key,brand_text,normalized_brand,model_text,normalized_model,garment_type_key,status,source,submission_count
)
select
  public.normalize_search_text(s.brand_name)||'|'||public.normalize_search_text(s.item_name)||'|'||s.garment_type_key,
  s.brand_name,
  public.normalize_search_text(s.brand_name),
  s.item_name,
  public.normalize_search_text(s.item_name),
  s.garment_type_key,
  'needs_enrichment',
  'starter_seed',
  0
from starter_seed_reclassify s
on conflict(identity_key) do update set
  source=case when public.catalog_candidates.source='member' then public.catalog_candidates.source else 'starter_seed' end,
  updated_at=now();

-- Remove only empty provisional seed Products created by the earlier branch migration.
-- Anything that already gained real references/evidence is preserved and goes through normal admin review.
with seed_products as (
  select p.id
  from public.products p
  join public.brands b on b.id=p.brand_id
  join starter_seed_reclassify s
    on b.normalized_name=public.normalize_search_text(s.brand_name)
   and p.normalized_name=public.normalize_search_text(s.item_name)
   and p.garment_type_key=s.garment_type_key
  where p.catalog_status='provisional'::public.product_data_status
    and p.market_segment='unknown'::public.garment_market_segment
    and not exists(select 1 from public.closet_items ci where ci.product_id=p.id)
    and not exists(select 1 from public.fit_reports fr where fr.product_id=p.id)
    and not exists(select 1 from public.product_variants pv where pv.product_id=p.id)
    and not exists(select 1 from public.product_identifiers pi where pi.product_id=p.id)
    and not exists(select 1 from public.retailer_listings rl where rl.product_id=p.id)
    and not exists(select 1 from public.product_metadata_evidence e where e.product_id=p.id)
    and not exists(select 1 from public.product_attribute_evidence e where e.product_id=p.id)
    and not exists(select 1 from public.product_material_evidence e where e.product_id=p.id)
    and not exists(select 1 from public.product_photo_evidence e where e.product_id=p.id)
)
delete from public.products p using seed_products s where p.id=s.id;

delete from public.product_families pf
using public.brands b, starter_seed_reclassify s
where pf.brand_id=b.id
  and b.normalized_name=public.normalize_search_text(s.brand_name)
  and pf.normalized_name=public.normalize_search_text(s.item_name)
  and pf.garment_type_key=s.garment_type_key
  and pf.market_segment='unknown'::public.garment_market_segment
  and not exists(select 1 from public.products p where p.product_family_id=pf.id);

comment on table public.catalog_candidates is
  'Controlled pending catalog candidates. The owner starter 150 are queued here for enrichment/review rather than being blindly promoted to canonical Products.';
