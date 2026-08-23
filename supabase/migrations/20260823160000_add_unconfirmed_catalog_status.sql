-- Owner-locked pre-publication catalog identity state.
-- Unconfirmed is below Provisional and is used only for unresolved candidate evidence
-- that a member explicitly marked as uncertain. It must never be a live Product status.

alter type public.product_data_status
  add value if not exists 'unconfirmed' before 'provisional';
