-- Preserve successful cached searches if the one-time benchmark is interrupted.
-- A complete benchmark closes permanently only after all 150 starter queries exist.

create or replace function public.pause_serpapi_starter_benchmark(p_token_hash text)
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  update private.serpapi_benchmark_control
  set active=false, token_hash=null
  where singleton=true and active=true and completed=false and token_hash=p_token_hash;
  if not found then raise exception 'Benchmark writer could not be paused'; end if;
end;
$$;

create or replace function public.finish_serpapi_starter_benchmark(p_token_hash text)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_cached integer;
begin
  select count(*) into v_cached
  from private.serpapi_discovery_cache
  where benchmark_group='starter_150_2026_08_22';
  if v_cached < 150 then
    raise exception 'Starter benchmark is incomplete: % of 150 cached',v_cached;
  end if;

  update private.serpapi_benchmark_control
  set active=false, completed=true, completed_at=now(), token_hash=null
  where singleton=true and active=true and completed=false and token_hash=p_token_hash;
  if not found then raise exception 'Benchmark writer could not be closed'; end if;
end;
$$;

revoke all on function public.pause_serpapi_starter_benchmark(text) from public;
grant execute on function public.pause_serpapi_starter_benchmark(text) to anon,authenticated;
