-- LikeSized canonical migration: derive an editable Product size-system default from real Fit Reports.
-- This does not create a second Product truth field. The default is inferred from submitted sizes,
-- ignores Not sure, and returns null when the leading size kind is tied.

create or replace function public.get_product_default_size_kinds(p_product_ids uuid[])
returns table(product_id uuid, default_size_kind public.garment_size_kind)
language sql
stable
security definer
set search_path = ''
as $$
  with votes as (
    select
      fr.product_id,
      ns.kind,
      count(*)::bigint as vote_count
    from public.fit_reports fr
    join public.normalized_sizes ns on ns.id = fr.normalized_size_id
    where fr.product_id = any(coalesce(p_product_ids, array[]::uuid[]))
      and fr.normalized_size_id is not null
      and ns.kind <> 'not_sure'::public.garment_size_kind
    group by fr.product_id, ns.kind
  ), ranked as (
    select
      v.*,
      dense_rank() over (partition by v.product_id order by v.vote_count desc) as vote_rank
    from votes v
  )
  select
    r.product_id,
    case
      when count(*) filter (where r.vote_rank = 1) = 1
        then min(r.kind::text) filter (where r.vote_rank = 1)::public.garment_size_kind
      else null::public.garment_size_kind
    end as default_size_kind
  from ranked r
  group by r.product_id;
$$;

revoke all on function public.get_product_default_size_kinds(uuid[]) from public, anon;
grant execute on function public.get_product_default_size_kinds(uuid[]) to authenticated;

comment on function public.get_product_default_size_kinds(uuid[]) is
  'Returns the majority size kind observed in Fit Reports for each Product. Ties and Not sure produce no editable default.';
