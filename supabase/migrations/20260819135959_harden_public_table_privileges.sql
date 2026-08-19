revoke all on
  public.profiles,
  public.fit_profiles,
  public.brands,
  public.products,
  public.product_variants,
  public.closet_items,
  public.fit_reports,
  public.follows,
  public.fit_matches,
  public.outfit_posts,
  public.outfit_post_items
from anon, authenticated;

grant select on public.profiles to anon, authenticated;
grant update on public.profiles to authenticated;

grant select, insert, update, delete on public.fit_profiles to authenticated;

grant select on public.brands, public.products, public.product_variants to anon, authenticated;
grant insert on public.brands, public.products, public.product_variants to authenticated;

grant select, insert, update, delete on public.closet_items to authenticated;
grant select, insert, update, delete on public.fit_reports to authenticated;
grant select, insert, delete on public.follows to authenticated;
grant select on public.fit_matches to authenticated;
grant select, insert, update, delete on public.outfit_posts to authenticated;
grant select, insert, delete on public.outfit_post_items to authenticated;