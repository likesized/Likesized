-- Add the Outfit comment moderation target in its own committed migration so later
-- functions may safely use the enum value during fresh replay.
alter type public.moderation_target_type add value if not exists 'outfit_comment';
