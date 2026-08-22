-- The owner-approved 150-item SerpAPI benchmark completed successfully.
-- Keep the reusable private discovery cache; remove the temporary write surface.

drop function if exists public.pause_serpapi_starter_benchmark(text);
drop function if exists public.finish_serpapi_starter_benchmark(text);
drop function if exists public.cache_serpapi_starter_benchmark_response(text,text,text,text,text,jsonb);
drop function if exists public.begin_serpapi_starter_benchmark(text);
drop table if exists private.serpapi_benchmark_control;

comment on table private.serpapi_discovery_cache is
  'Private reusable SerpAPI discovery cache populated by the completed 150-item starter benchmark. Cached external results are candidate/evidence data only and never directly define canonical Product identity.';
