-- Broad Explore categories approved for the controlled garment taxonomy.
-- Enum values are committed separately before later migrations use them.
alter type public.garment_category add value if not exists 'swimwear';
alter type public.garment_category add value if not exists 'intimates';
