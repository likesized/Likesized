-- Brand aliases are reviewed canonical catalog data under the submission-first model.
-- The older authoritative foundation allowed any authenticated member to insert aliases;
-- remove that direct write path and keep writes behind the audited admin RPC.

drop policy if exists "authenticated add brand alias" on public.brand_aliases;
revoke insert on public.brand_aliases from authenticated;
grant select on public.brand_aliases to anon,authenticated;

comment on table public.brand_aliases is 'Reviewed hidden Brand-name aliases. Members may read them for canonical resolution; only authorized catalog/admin paths may write them.';
