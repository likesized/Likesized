create or replace function public.enforce_fit_reference_photo_shared()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_owner uuid;
  v_visibility public.closet_visibility;
begin
  select ci.user_id, ci.visibility
    into v_owner, v_visibility
  from public.closet_items ci
  where ci.id = new.closet_item_id;

  if v_owner is null then
    raise exception 'Fit reference photo requires an existing Closet item';
  end if;

  if new.user_id is distinct from v_owner then
    raise exception 'Fit reference photo owner must match Closet item owner';
  end if;

  if v_visibility <> 'shared'::public.closet_visibility then
    raise exception 'Fit reference photo requires a Shared Closet item';
  end if;

  return new;
end;
$$;

drop trigger if exists fit_reference_photo_shared_guard on public.fit_reference_photos;
create trigger fit_reference_photo_shared_guard
before insert or update of closet_item_id, user_id
on public.fit_reference_photos
for each row
execute function public.enforce_fit_reference_photo_shared();

create or replace function public.prevent_private_closet_with_fit_photo()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.visibility = 'private'::public.closet_visibility
     and old.visibility is distinct from new.visibility
     and exists (
       select 1
       from public.fit_reference_photos fp
       where fp.closet_item_id = new.id
     ) then
    raise exception 'Remove the fit reference photo before making this Closet item private';
  end if;

  return new;
end;
$$;

drop trigger if exists closet_fit_photo_visibility_guard on public.closet_items;
create trigger closet_fit_photo_visibility_guard
before update of visibility
on public.closet_items
for each row
execute function public.prevent_private_closet_with_fit_photo();

comment on function public.enforce_fit_reference_photo_shared() is
  'Database-level V1 invariant: fit/reference-photo metadata must belong to the Closet owner and may exist only for Shared Closet items.';

comment on function public.prevent_private_closet_with_fit_photo() is
  'Database-level V1 invariant: a Closet item with fit/reference-photo metadata cannot become Private until the photo metadata is removed.';
