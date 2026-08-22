-- One-time writer used only by the owner-approved 150-item SerpAPI benchmark.
-- It can write only to private.serpapi_discovery_cache and permanently closes
-- itself when the benchmark finishes. It cannot mutate Products or Fit Reports.

create table if not exists private.serpapi_benchmark_control (
  singleton boolean primary key default true check (singleton),
  token_hash text,
  active boolean not null default false,
  completed boolean not null default false,
  started_at timestamptz,
  completed_at timestamptz
);

insert into private.serpapi_benchmark_control(singleton)
values(true)
on conflict(singleton) do nothing;

create or replace function public.begin_serpapi_starter_benchmark(p_token_hash text)
returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
  v_row private.serpapi_benchmark_control%rowtype;
begin
  if p_token_hash is null or p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid benchmark token';
  end if;

  select * into v_row
  from private.serpapi_benchmark_control
  where singleton=true
  for update;

  if v_row.completed then return false; end if;
  if v_row.active then return v_row.token_hash=p_token_hash; end if;

  update private.serpapi_benchmark_control
  set token_hash=p_token_hash, active=true, started_at=now()
  where singleton=true;
  return true;
end;
$$;

create or replace function public.cache_serpapi_starter_benchmark_response(
  p_token_hash text,
  p_query_text text,
  p_expected_brand text,
  p_expected_model text,
  p_expected_garment_type text,
  p_raw_response jsonb
) returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_control private.serpapi_benchmark_control%rowtype;
  v_normalized text;
  v_search_id text;
  v_count integer:=0;
begin
  select * into v_control from private.serpapi_benchmark_control where singleton=true;
  if not v_control.active or v_control.completed or v_control.token_hash is distinct from p_token_hash then
    raise exception 'Benchmark writer is not active';
  end if;
  if p_query_text is null or char_length(btrim(p_query_text)) not between 1 and 220 then
    raise exception 'Invalid benchmark query';
  end if;
  if p_raw_response is null or octet_length(p_raw_response::text) > 3000000 then
    raise exception 'Invalid benchmark response';
  end if;
  if coalesce(p_raw_response#>>'{search_parameters,engine}','') <> 'google_shopping' and p_raw_response ? 'shopping_results' then
    raise exception 'Unexpected SerpAPI engine';
  end if;

  v_normalized:=public.normalize_search_text(p_query_text);
  if v_normalized is null then raise exception 'Invalid normalized query'; end if;
  v_search_id:=nullif(p_raw_response#>>'{search_metadata,id}','');
  if jsonb_typeof(p_raw_response->'shopping_results')='array' then
    v_count:=jsonb_array_length(p_raw_response->'shopping_results');
  end if;

  insert into private.serpapi_discovery_cache(
    engine,query_text,normalized_query,benchmark_group,
    expected_brand,expected_model,expected_garment_type,
    search_id,result_count,raw_response,fetched_at,last_reused_at
  ) values(
    'google_shopping',btrim(p_query_text),v_normalized,'starter_150_2026_08_22',
    nullif(btrim(p_expected_brand),''),nullif(btrim(p_expected_model),''),nullif(btrim(p_expected_garment_type),''),
    v_search_id,v_count,p_raw_response,now(),now()
  )
  on conflict(engine,normalized_query) do update
  set last_reused_at=now();
end;
$$;

create or replace function public.finish_serpapi_starter_benchmark(p_token_hash text)
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  update private.serpapi_benchmark_control
  set active=false, completed=true, completed_at=now(), token_hash=null
  where singleton=true and active=true and completed=false and token_hash=p_token_hash;
  if not found then raise exception 'Benchmark writer could not be closed'; end if;
end;
$$;

revoke all on function public.begin_serpapi_starter_benchmark(text) from public;
revoke all on function public.cache_serpapi_starter_benchmark_response(text,text,text,text,text,jsonb) from public;
revoke all on function public.finish_serpapi_starter_benchmark(text) from public;
grant execute on function public.begin_serpapi_starter_benchmark(text) to anon,authenticated;
grant execute on function public.cache_serpapi_starter_benchmark_response(text,text,text,text,text,jsonb) to anon,authenticated;
grant execute on function public.finish_serpapi_starter_benchmark(text) to anon,authenticated;

comment on function public.cache_serpapi_starter_benchmark_response(text,text,text,text,text,jsonb) is
  'One-time benchmark-only writer. Stores raw SerpAPI discovery responses in private cache; never mutates canonical Product identity.';
