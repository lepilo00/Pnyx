-- ============================================================
-- Democracy Walk — Pnyx Athens
-- Supabase Database Schema
-- Paste this into: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists walks (
  id               uuid primary key default uuid_generate_v4(),
  title            text not null,
  slug             text not null unique,
  description      text not null default '',
  location_name    text not null default '',
  duration_minutes integer not null default 20,
  -- Landing-page intro audio; intro_audio_url is the English/default track,
  -- intro_audio_urls holds per-language tracks: { "sl": "https://…" }
  intro_audio_url  text,
  intro_audio_urls jsonb not null default '{}'::jsonb,
  is_published     boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists stops (
  id           uuid primary key default uuid_generate_v4(),
  walk_id      uuid not null references walks(id) on delete cascade,
  order_index  integer not null,
  title        text not null,
  description  text not null default '',
  audio_url    text,
  -- Per-language audio: { "sl": "https://…", "fr": "https://…" }; audio_url is the English/default track
  audio_urls   jsonb not null default '{}'::jsonb,
  image_url    text,
  latitude     decimal(10, 8),
  longitude    decimal(11, 8),
  is_published boolean not null default false,
  is_paid      boolean not null default false,
  is_bonus     boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Keep older installations compatible with the current application.
alter table stops add column if not exists is_paid boolean not null default false;
alter table stops add column if not exists is_bonus boolean not null default false;

create unique index if not exists stops_walk_order_unique
  on stops (walk_id, order_index);

create table if not exists app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists email_signups (
  id         uuid primary key default uuid_generate_v4(),
  email      text not null,
  source     text not null default 'unknown',
  consent    boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists email_signups_email_index
  on email_signups (lower(email));

create table if not exists feedback (
  id         uuid primary key default uuid_generate_v4(),
  rating     integer check (rating >= 1 and rating <= 5),
  message    text,
  would_pay  text check (would_pay in ('yes', 'maybe', 'no')),
  created_at timestamptz not null default now()
);

create table if not exists analytics_events (
  id         uuid primary key default uuid_generate_v4(),
  event_name text not null,
  page_path  text not null,
  stop_id    uuid references stops(id) on delete set null,
  metadata   jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists walks_updated_at on walks;
create trigger walks_updated_at
  before update on walks
  for each row execute function update_updated_at_column();

drop trigger if exists stops_updated_at on stops;
create trigger stops_updated_at
  before update on stops
  for each row execute function update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table walks             enable row level security;
alter table stops             enable row level security;
alter table email_signups     enable row level security;
alter table feedback          enable row level security;
alter table analytics_events  enable row level security;
alter table app_settings      enable row level security;

-- Admin access is intentionally separate from ordinary authenticated users.
-- Assign it from a trusted server/admin console, never from the browser:
-- app_metadata: { "role": "admin" }
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

-- Public visitors: read only published walks
drop policy if exists "Public can read published walks" on walks;
create policy "Public can read published walks"
  on walks for select
  using (is_published = true);

-- Public visitors: read only published stops
drop policy if exists "Public can read published stops" on stops;
create policy "Public can read published stops"
  on stops for select
  using (is_published = true);

-- Public visitors: submit email signups (no auth required)
drop policy if exists "Public can insert email signups" on email_signups;
create policy "Public can insert email signups"
  on email_signups for insert
  with check (
    consent = true
    and email = lower(trim(email))
    and length(email) between 3 and 254
    and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    and length(source) between 1 and 64
  );

-- Public visitors: submit feedback (no auth required)
drop policy if exists "Public can insert feedback" on feedback;
create policy "Public can insert feedback"
  on feedback for insert
  with check (
    rating between 1 and 5
    and (message is null or length(message) <= 2000)
    and (would_pay is null or would_pay in ('yes', 'maybe', 'no'))
  );

-- Public visitors: log analytics events (no auth required)
drop policy if exists "Public can insert analytics events" on analytics_events;
create policy "Public can insert analytics events"
  on analytics_events for insert
  with check (
    event_name in (
      'landing_page_view', 'intro_audio_started', 'start_walk_clicked',
      'stop_opened', 'stop_audio_started', 'stop_completed', 'walk_completed',
      'email_signup_submitted', 'feedback_submitted', 'would_pay_answered',
      'destination_arrived', 'donation_prompt_shown', 'donation_amount_selected',
      'support_screen_shown', 'donation_unlock', 'paywall_shown', 'unlock_confirmed'
    )
    and length(page_path) between 1 and 256
    and (metadata is null or pg_column_size(metadata) <= 4096)
  );

drop policy if exists "Public can read app settings" on app_settings;
create policy "Public can read app settings"
  on app_settings for select
  using (key = 'unlock_price_eur');

-- Authenticated admin: full access to all tables
drop policy if exists "Admin full access walks" on walks;
create policy "Admin full access walks"
  on walks for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin full access stops" on stops;
create policy "Admin full access stops"
  on stops for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin full access email signups" on email_signups;
create policy "Admin full access email signups"
  on email_signups for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin full access feedback" on feedback;
create policy "Admin full access feedback"
  on feedback for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin full access analytics" on analytics_events;
create policy "Admin full access analytics"
  on analytics_events for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin full access app settings" on app_settings;
create policy "Admin full access app settings"
  on app_settings for all
  using (public.is_admin()) with check (public.is_admin());

-- Reordering must be atomic. Negative temporary order avoids the unique index.
create or replace function public.swap_stop_order(first_stop_id uuid, second_stop_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  first_order integer;
  second_order integer;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  select order_index into first_order from stops where id = first_stop_id for update;
  select order_index into second_order from stops where id = second_stop_id for update;
  if first_order is null or second_order is null then
    raise exception 'Stop not found';
  end if;

  update stops set order_index = -1 where id = first_stop_id;
  update stops set order_index = first_order where id = second_stop_id;
  update stops set order_index = second_order where id = first_stop_id;
end;
$$;

-- ============================================================
-- SEED DATA — The Pnyx Walk
-- ============================================================

-- Insert the walk
insert into walks (title, slug, description, location_name, duration_minutes, is_published)
values (
  'Democracy Walk',
  'democracy-walk-pnyx',
  'Walk where Athenian citizens voted on war, law, and the future of civilization. A self-guided audio tour of democracy''s birthplace.',
  'Pnyx Hill, Athens, Greece',
  20,
  true
)
on conflict (slug) do nothing;

-- Insert the 4 stops (walk_id will be set to the walk we just created)
with walk as (
  select id from walks where slug = 'democracy-walk-pnyx' limit 1
)
insert into stops (walk_id, order_index, title, description, is_published)
select
  walk.id,
  s.order_index,
  s.title,
  s.description,
  true
from walk, (values
  (1,
   'Why almost everyone misses the Pnyx',
   'Most visitors come to Athens for the Acropolis. But a short walk away stands a quieter hill where one of the most important political experiments in human history took shape.'),
  (2,
   'Where the Athenian Assembly met',
   'This was the meeting place of the ekklesia, the citizens'' assembly of ancient Athens. Here, thousands of citizens gathered to debate, vote and decide on matters of war, law and public life.'),
  (3,
   'Who was allowed to speak — and who was excluded',
   'Athenian democracy was revolutionary, but it was not equal by modern standards. Women, enslaved people and foreigners were excluded from political participation.'),
  (4,
   'What democracy meant then — and what it means now',
   'The Pnyx reminds us that democracy was not born as a finished system. It was debated, limited, expanded and challenged — just as democracy still is today.')
) as s(order_index, title, description)
on conflict (walk_id, order_index) do nothing;

insert into app_settings (key, value)
values ('unlock_price_eur', '6.99'::jsonb)
on conflict (key) do nothing;
