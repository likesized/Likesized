-- Preserve one private uncached exact evidence resolver, then make the established public
-- Product-evidence RPC demand-driven and cache-backed for every existing call site.

create or replace function private.calculate_product_evidence_candidates_uncached(
  p_product_id uuid,
  p_variant_id uuid,
  p_result_limit integer
)
returns table(
  fit_report_id uuid,user_id uuid,closet_item_id uuid,evidence_product_id uuid,evidence_variant_id uuid,
  fit_profile_version_id uuid,original_size_label text,normalized_size_id uuid,fit public.fit_rating,
  would_buy_again boolean,historical_match_score integer,historical_coverage_percent integer,
  evidence_level public.evidence_level,evidence_rank integer,attribute_overlap integer,directional_fit_support numeric
)
language sql
security definer
set search_path=''
as $$
with core as materialized (
  select * from private.resolve_product_evidence_core(p_product_id,p_variant_id,p_result_limit)
),
pressures as materialized (
  select * from private.calculate_directional_pressures_for_product(
    array(select distinct c.fit_profile_version_id from core c where c.fit_profile_version_id is not null),
    p_product_id
  )
)
select c.fit_report_id,c.user_id,c.closet_item_id,c.evidence_product_id,c.evidence_variant_id,
  c.fit_profile_version_id,c.original_size_label,c.normalized_size_id,c.fit,c.would_buy_again,
  c.historical_match_score,c.historical_coverage_percent,c.evidence_level,c.evidence_rank,c.attribute_overlap,
  private.directional_fit_support_from_pressure(c.fit,coalesce(p.pressure,0))
from core c
left join pressures p using(fit_profile_version_id)
order by c.evidence_rank,c.historical_match_score desc,c.historical_coverage_percent desc,c.attribute_overlap desc,c.fit_report_id;
$$;
revoke all on function private.calculate_product_evidence_candidates_uncached(uuid,uuid,integer) from public,anon,authenticated;

create or replace function public.get_cached_product_evidence_candidates(
  p_product_id uuid,
  p_variant_id uuid default null::uuid,
  p_result_limit integer default 300
)
returns table(
  fit_report_id uuid,user_id uuid,closet_item_id uuid,evidence_product_id uuid,evidence_variant_id uuid,
  fit_profile_version_id uuid,original_size_label text,normalized_size_id uuid,fit public.fit_rating,
  would_buy_again boolean,historical_match_score integer,historical_coverage_percent integer,
  evidence_level public.evidence_level,evidence_rank integer,attribute_overlap integer,directional_fit_support numeric
)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_user_id uuid:=auth.uid();
  v_limit integer:=least(greatest(coalesce(p_result_limit,300),1),300);
  v_input_version bigint;
  v_algorithm_version integer;
  v_token text;
  v_variant_key text:=coalesce(p_variant_id::text,'');
  v_payload jsonb;
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
  select fp.match_input_version into v_input_version from public.fit_profiles fp
    where fp.user_id=v_user_id and fp.completed_at is not null;
  if v_input_version is null then return; end if;
  select s.algorithm_version into v_algorithm_version from private.fituition_algorithm_state s where s.singleton;
  v_token:=private.current_fit_evidence_token(p_product_id);

  select c.payload into v_payload
  from private.fituition_evidence_cache c
  where c.viewer_user_id=v_user_id and c.product_id=p_product_id and c.variant_cache_key=v_variant_key
    and c.viewer_input_version=v_input_version and c.algorithm_version=v_algorithm_version
    and c.evidence_token=v_token and c.computed_at>=now()-interval '12 hours';

  if v_payload is null then
    perform set_config('statement_timeout','4000',true);
    select coalesce(jsonb_agg(to_jsonb(e) order by e.evidence_rank,e.historical_match_score desc,e.historical_coverage_percent desc,e.fit_report_id),'[]'::jsonb)
      into v_payload
    from private.calculate_product_evidence_candidates_uncached(p_product_id,p_variant_id,300) e;

    insert into private.fituition_evidence_cache(
      viewer_user_id,product_id,variant_cache_key,viewer_input_version,algorithm_version,evidence_token,payload,computed_at
    ) values(v_user_id,p_product_id,v_variant_key,v_input_version,v_algorithm_version,v_token,v_payload,now())
    on conflict(viewer_user_id,product_id,variant_cache_key) do update set
      viewer_input_version=excluded.viewer_input_version,
      algorithm_version=excluded.algorithm_version,
      evidence_token=excluded.evidence_token,
      payload=excluded.payload,
      computed_at=now();
  end if;

  return query
  select x.fit_report_id,x.user_id,x.closet_item_id,x.evidence_product_id,x.evidence_variant_id,
    x.fit_profile_version_id,x.original_size_label,x.normalized_size_id,x.fit,x.would_buy_again,
    x.historical_match_score,x.historical_coverage_percent,x.evidence_level,x.evidence_rank,
    x.attribute_overlap,x.directional_fit_support
  from jsonb_to_recordset(v_payload) as x(
    fit_report_id uuid,user_id uuid,closet_item_id uuid,evidence_product_id uuid,evidence_variant_id uuid,
    fit_profile_version_id uuid,original_size_label text,normalized_size_id uuid,fit public.fit_rating,
    would_buy_again boolean,historical_match_score integer,historical_coverage_percent integer,
    evidence_level public.evidence_level,evidence_rank integer,attribute_overlap integer,directional_fit_support numeric
  )
  limit v_limit;
end;
$$;
revoke all on function public.get_cached_product_evidence_candidates(uuid,uuid,integer) from public,anon;
grant execute on function public.get_cached_product_evidence_candidates(uuid,uuid,integer) to authenticated,service_role;

create or replace function public.get_product_evidence_candidates(
  p_product_id uuid,
  p_variant_id uuid default null::uuid,
  p_result_limit integer default 200
)
returns table(
  fit_report_id uuid,user_id uuid,closet_item_id uuid,evidence_product_id uuid,evidence_variant_id uuid,
  fit_profile_version_id uuid,original_size_label text,normalized_size_id uuid,fit public.fit_rating,
  would_buy_again boolean,historical_match_score integer,historical_coverage_percent integer,
  evidence_level public.evidence_level,evidence_rank integer,attribute_overlap integer,directional_fit_support numeric
)
language sql
security invoker
set search_path=''
as $$
  select * from public.get_cached_product_evidence_candidates(p_product_id,p_variant_id,p_result_limit);
$$;
revoke all on function public.get_product_evidence_candidates(uuid,uuid,integer) from public,anon;
grant execute on function public.get_product_evidence_candidates(uuid,uuid,integer) to authenticated,service_role;

comment on function public.get_product_evidence_candidates(uuid,uuid,integer) is
  'Compatibility entry point for full personalized FITuition evidence. The expensive exact resolver now runs only on a versioned cache miss; existing callers automatically reuse persistent cached evidence.';
