-- Banners became the homepage hero carousel, so each one needs somewhere to go
-- when a guest taps it.
--
--   link_type  'category' → link_value is a menu_items.category value
--              'external' → link_value is a full https:// URL
--              NULL       → the banner is just a picture, and is not tappable
--
-- Run this once in the Supabase SQL editor. Until it has run, banners keep
-- working exactly as before: the site reads the columns if they are there and
-- treats every banner as untappable if they are not.

alter table public.banners
  add column if not exists link_type text
    check (link_type is null or link_type in ('category', 'external')),
  add column if not exists link_value text;

comment on column public.banners.link_type is 'category | external | null — what link_value means';
comment on column public.banners.link_value is 'A menu category name, or a full https:// URL';
