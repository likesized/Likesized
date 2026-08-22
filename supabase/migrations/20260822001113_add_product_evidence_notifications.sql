create table public.product_evidence_notifications (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  requested_at timestamptz not null default now(),
  last_notified_at timestamptz,
  read_at timestamptz,
  primary key(user_id, product_id)
);
create index product_evidence_notifications_unread_idx
  on public.product_evidence_notifications(user_id, last_notified_at desc)
  where last_notified_at is not null and read_at is null;
create index product_evidence_notifications_product_idx
  on public.product_evidence_notifications(product_id);
alter table public.product_evidence_notifications enable row level security;
create policy "Members manage their product evidence notifications"
  on public.product_evidence_notifications for all to authenticated
  using ((select auth.uid())=user_id)
  with check ((select auth.uid())=user_id);
grant select,insert,update,delete on public.product_evidence_notifications to authenticated;

create or replace function private.notify_product_evidence_watchers()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  update public.product_evidence_notifications
  set last_notified_at=now(), read_at=null
  where product_id=new.product_id
    and user_id<>new.user_id
    and requested_at<=new.created_at;
  return new;
end;
$$;
revoke all on function private.notify_product_evidence_watchers() from public,anon,authenticated;
create trigger notify_product_evidence_watchers_after_fit_report
after insert on public.fit_reports for each row
execute function private.notify_product_evidence_watchers();

comment on table public.product_evidence_notifications is 'Member requests for an in-app alert when a product with insufficient useful matching evidence receives a new Fit Report.';
