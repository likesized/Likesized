-- Add an explicit unknown-size state without overloading the tracked free-form Other bucket.
alter type public.garment_size_kind add value if not exists 'not_sure';
