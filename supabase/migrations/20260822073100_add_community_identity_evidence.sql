-- Field-level identity disagreements from the community. These claims never silently
-- replace canonical Product identity; they create review evidence for the canonical
-- duplicate/identity workflow.

create table public.product_identity_evidence (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  field_key text not null check(field_key in ('brand_name','item_name','manufacturer_style','barcode')),
  value_text text not null check(char_length(btrim(value_text)) between 1 and 180),
  source_status public.product_data_status not null default 'provisional',
  submitted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index product_identity_evidence_product_idx on public.product_identity_evidence(product_id,field_key,created_at desc);
create unique index product_identity_evidence_member_uq on public.product_identity_evidence(product_id,field_key,submitted_by) where submitted_by is not null;
alter table public.product_identity_evidence enable row level security;
create policy "Members read product identity evidence" on public.product_identity_evidence for select to authenticated using(true);
create policy "Members add own product identity issues" on public.product_identity_evidence for insert to authenticated
with check(source_status='provisional'::public.product_data_status and submitted_by=(select auth.uid()));
grant select,insert on public.product_identity_evidence to authenticated;

create or replace function private.flag_product_identity_issue()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_current text;
begin
  if new.source_status='rejected'::public.product_data_status then return new; end if;
  if new.field_key='brand_name' then
    select b.name into v_current from public.products p join public.brands b on b.id=p.brand_id where p.id=new.product_id;
  elsif new.field_key='item_name' then
    select p.name into v_current from public.products p where p.id=new.product_id;
  elsif new.field_key='manufacturer_style' then
    select p.manufacturer_style_number into v_current from public.products p where p.id=new.product_id;
  elsif new.field_key='barcode' then
    select pi.original_value into v_current
    from public.product_identifiers pi
    where pi.product_id=new.product_id and pi.identifier_type in ('upc'::public.product_identifier_type,'barcode'::public.product_identifier_type)
    order by pi.created_at nulls last,pi.id
    limit 1;
  end if;

  if new.field_key='barcode' then
    if public.normalize_identifier(coalesce(v_current,'')) is distinct from public.normalize_identifier(new.value_text) then
      update public.products set catalog_review_needed=true where id=new.product_id;
    end if;
  elsif public.normalize_search_text(coalesce(v_current,'')) is distinct from public.normalize_search_text(new.value_text) then
    update public.products set catalog_review_needed=true where id=new.product_id;
  end if;
  return new;
end;
$$;
revoke all on function private.flag_product_identity_issue() from public,anon,authenticated;
create trigger flag_product_identity_issue_after_insert after insert on public.product_identity_evidence
for each row execute function private.flag_product_identity_issue();

create or replace function public.record_member_product_identity_issue(
  p_product_id uuid,
  p_field_key text,
  p_value text
) returns void
language plpgsql security invoker set search_path='' as $$
declare v_user_id uuid:=auth.uid();
begin
  if v_user_id is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if p_field_key not in ('brand_name','item_name','manufacturer_style','barcode') then raise exception 'Unknown identity field'; end if;
  if char_length(btrim(coalesce(p_value,''))) not between 1 and 180 then raise exception 'Invalid identity value'; end if;
  if p_field_key='barcode' and public.normalize_identifier(p_value) !~ '^[0-9]{6,32}$' then raise exception 'Invalid barcode value'; end if;
  insert into public.product_identity_evidence(product_id,field_key,value_text,source_status,submitted_by)
  values(p_product_id,p_field_key,btrim(p_value),'provisional',v_user_id)
  on conflict(product_id,field_key,submitted_by) where submitted_by is not null
  do update set value_text=excluded.value_text,source_status='provisional',created_at=now();
end;
$$;
revoke all on function public.record_member_product_identity_issue(uuid,text,text) from public,anon;
grant execute on function public.record_member_product_identity_issue(uuid,text,text) to authenticated;

comment on table public.product_identity_evidence is 'Community-reported Brand, Item name, manufacturer-style, or barcode disagreements. They feed duplicate/identity admin review and never silently rewrite Product identity.';
