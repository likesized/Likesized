-- Canonical external-catalog import controls.
-- Provider credentials stay in server environment variables; this migration stores
-- only enabled/disabled state, hard request caps, usage, and owner alerts.

create table private.catalog_import_providers (
  provider_key text primary key check (provider_key in ('brave_search','diffbot_product','upcitemdb','sovrn_commerce')),
  enabled boolean not null default false,
  monthly_request_limit integer check (monthly_request_limit is null or monthly_request_limit > 0),
  warning_percent smallint not null default 80 check (warning_percent between 1 and 99),
  critical_percent smallint not null default 95 check (critical_percent between 1 and 100),
  no_paid_overage boolean not null default true,
  updated_at timestamptz not null default now(),
  check (critical_percent >= warning_percent)
);

insert into private.catalog_import_providers(provider_key,enabled,monthly_request_limit,no_paid_overage) values
  ('brave_search',false,1000,true),
  ('diffbot_product',false,null,true),
  ('upcitemdb',false,null,true),
  ('sovrn_commerce',false,null,true)
on conflict(provider_key) do nothing;

create table private.catalog_import_provider_usage (
  provider_key text not null references private.catalog_import_providers(provider_key) on delete cascade,
  period_start date not null,
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key(provider_key,period_start)
);

create table private.catalog_import_requests (
  id uuid primary key default gen_random_uuid(),
  provider_key text not null references private.catalog_import_providers(provider_key) on delete cascade,
  requester_id uuid not null references auth.users(id) on delete cascade,
  requested_at timestamptz not null default now()
);
create index catalog_import_requests_rate_limit_idx on private.catalog_import_requests(provider_key,requester_id,requested_at desc);

create table private.catalog_import_provider_alerts (
  provider_key text not null references private.catalog_import_providers(provider_key) on delete cascade,
  period_start date not null,
  severity text not null check (severity in ('warning','critical','limit_reached')),
  request_count integer not null,
  request_limit integer not null,
  created_at timestamptz not null default now(),
  primary key(provider_key,period_start,severity)
);

create or replace function public.reserve_catalog_import_request(p_provider_key text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_provider private.catalog_import_providers%rowtype;
  v_period date := date_trunc('month', now())::date;
  v_usage private.catalog_import_provider_usage%rowtype;
  v_hourly_count integer;
  v_percent numeric;
  v_severity text := null;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  select * into v_provider from private.catalog_import_providers where provider_key = p_provider_key for update;
  if not found or not v_provider.enabled or v_provider.monthly_request_limit is null then
    return jsonb_build_object('allowed',false,'reason','not_enabled');
  end if;

  select count(*) into v_hourly_count from private.catalog_import_requests
    where provider_key=p_provider_key and requester_id=v_user_id and requested_at >= now() - interval '1 hour';
  if v_hourly_count >= 30 then
    return jsonb_build_object('allowed',false,'reason','rate_limited');
  end if;

  insert into private.catalog_import_provider_usage(provider_key,period_start,request_count)
    values(p_provider_key,v_period,0)
    on conflict(provider_key,period_start) do nothing;
  select * into v_usage from private.catalog_import_provider_usage
    where provider_key=p_provider_key and period_start=v_period for update;
  if v_usage.request_count >= v_provider.monthly_request_limit then
    insert into private.catalog_import_provider_alerts(provider_key,period_start,severity,request_count,request_limit)
      values(p_provider_key,v_period,'limit_reached',v_usage.request_count,v_provider.monthly_request_limit)
      on conflict(provider_key,period_start,severity) do nothing;
    return jsonb_build_object('allowed',false,'reason','limit_reached');
  end if;

  update private.catalog_import_provider_usage set request_count=request_count+1,updated_at=now()
    where provider_key=p_provider_key and period_start=v_period
    returning * into v_usage;
  insert into private.catalog_import_requests(provider_key,requester_id) values(p_provider_key,v_user_id);
  v_percent := (v_usage.request_count::numeric / v_provider.monthly_request_limit::numeric) * 100;
  if v_percent >= v_provider.critical_percent then v_severity := 'critical';
  elsif v_percent >= v_provider.warning_percent then v_severity := 'warning'; end if;
  if v_severity is not null then
    insert into private.catalog_import_provider_alerts(provider_key,period_start,severity,request_count,request_limit)
      values(p_provider_key,v_period,v_severity,v_usage.request_count,v_provider.monthly_request_limit)
      on conflict(provider_key,period_start,severity) do update set request_count=excluded.request_count,request_limit=excluded.request_limit,created_at=now();
  end if;
  return jsonb_build_object('allowed',true,'request_count',v_usage.request_count,'request_limit',v_provider.monthly_request_limit,'alert',v_severity);
end;
$$;
revoke all on function public.reserve_catalog_import_request(text) from public,anon;
grant execute on function public.reserve_catalog_import_request(text) to authenticated;

create or replace function public.get_catalog_import_provider_alerts()
returns table(provider_key text, severity text, request_count integer, request_limit integer, created_at timestamptz)
language sql security definer set search_path = '' as $$
  select a.provider_key,a.severity,a.request_count,a.request_limit,a.created_at
  from private.catalog_import_provider_alerts a
  where private.is_admin()
  order by a.created_at desc;
$$;
revoke all on function public.get_catalog_import_provider_alerts() from public,anon;
grant execute on function public.get_catalog_import_provider_alerts() to authenticated;

comment on table private.catalog_import_providers is 'Historical external-catalog provider controls. Removed from active schema by the later community-catalog migration.';
comment on table private.catalog_import_provider_usage is 'Historical external-catalog request accounting. Removed from active schema by the later community-catalog migration.';
comment on table private.catalog_import_provider_alerts is 'Historical external-catalog alerts. Removed from active schema by the later community-catalog migration.';
