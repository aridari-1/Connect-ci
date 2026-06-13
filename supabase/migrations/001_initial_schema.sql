-- ============================================================
-- ServiceCI — Supabase Database Schema
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard → your project → SQL Editor
-- ============================================================

-- Enable UUID extension (already enabled on most Supabase projects)
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PROFILES
--    Extends Supabase auth.users with app-specific fields.
--    A trigger auto-creates this row when a user signs up.
-- ============================================================
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  phone         text,
  city          text,
  bio           text,
  avatar_url    text,
  is_verified   boolean default false,
  is_provider   boolean default false,  -- true once they post a service
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone, city)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'city'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. SERVICES
--    The core listings table.
-- ============================================================
create table public.services (
  id            uuid primary key default uuid_generate_v4(),
  provider_id   uuid not null references public.profiles(id) on delete cascade,
  title         text not null,
  category      text not null,
  description   text not null,
  price         integer not null,           -- in FCFA
  price_unit    text default 'par intervention',
  city          text not null,
  phone         text,                       -- WhatsApp contact
  availability  text,
  experience    text,
  tags          text[],                     -- array of keyword strings
  images        text[],                     -- array of image URLs (Supabase storage)
  is_active     boolean default true,
  is_featured   boolean default false,
  views         integer default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Full text search index
create index services_search_idx on public.services
  using gin(to_tsvector('french', title || ' ' || description || ' ' || category));

-- Fast category/city lookups
create index services_category_idx on public.services(category);
create index services_city_idx on public.services(city);
create index services_active_idx on public.services(is_active);

-- ============================================================
-- 3. BOOKINGS
--    Records every paid booking with Paystack reference.
-- ============================================================
create table public.bookings (
  id                  uuid primary key default uuid_generate_v4(),
  service_id          uuid not null references public.services(id),
  client_id           uuid not null references public.profiles(id),
  provider_id         uuid not null references public.profiles(id),
  amount              integer not null,          -- total paid in FCFA
  paystack_reference  text unique,               -- Paystack transaction reference
  payment_method      text default 'paystack',   -- 'card' | 'mobile_money' | 'paystack'
  status              text default 'paid'
    check (status in ('pending','paid','confirmed','completed','cancelled','refunded')),
  notes               text,
  scheduled_at        timestamptz,               -- optional: when the service is scheduled
  completed_at        timestamptz,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index bookings_client_idx   on public.bookings(client_id);
create index bookings_provider_idx on public.bookings(provider_id);
create index bookings_status_idx   on public.bookings(status);

-- ============================================================
-- 4. REVIEWS
--    Clients review services after completion.
-- ============================================================
create table public.reviews (
  id          uuid primary key default uuid_generate_v4(),
  service_id  uuid not null references public.services(id) on delete cascade,
  booking_id  uuid references public.bookings(id),
  reviewer_id uuid not null references public.profiles(id),
  rating      integer not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz default now()
);

create index reviews_service_idx on public.reviews(service_id);
-- One review per booking
create unique index reviews_booking_unique on public.reviews(booking_id) where booking_id is not null;

-- ============================================================
-- 5. MESSAGES
--    In-app messaging between clients and providers.
-- ============================================================
create table public.messages (
  id          uuid primary key default uuid_generate_v4(),
  booking_id  uuid references public.bookings(id),
  sender_id   uuid not null references public.profiles(id),
  receiver_id uuid not null references public.profiles(id),
  content     text not null,
  is_read     boolean default false,
  created_at  timestamptz default now()
);

create index messages_booking_idx  on public.messages(booking_id);
create index messages_sender_idx   on public.messages(sender_id);
create index messages_receiver_idx on public.messages(receiver_id);

-- ============================================================
-- 6. ROW LEVEL SECURITY (RLS)
--    Controls who can read/write each table.
-- ============================================================

-- Profiles: public read, owner write
alter table public.profiles enable row level security;
create policy "Profiles are publicly readable"
  on public.profiles for select using (true);
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Services: public read, owner write
alter table public.services enable row level security;
create policy "Services are publicly readable"
  on public.services for select using (is_active = true);
create policy "Providers can insert their services"
  on public.services for insert with check (auth.uid() = provider_id);
create policy "Providers can update their own services"
  on public.services for update using (auth.uid() = provider_id);

-- Bookings: only involved parties
alter table public.bookings enable row level security;
create policy "Clients see their bookings"
  on public.bookings for select using (auth.uid() = client_id);
create policy "Providers see their bookings"
  on public.bookings for select using (auth.uid() = provider_id);
create policy "Authenticated users can create bookings"
  on public.bookings for insert with check (auth.uid() = client_id);
create policy "Provider can update booking status"
  on public.bookings for update using (auth.uid() = provider_id);

-- Reviews: public read, reviewer write
alter table public.reviews enable row level security;
create policy "Reviews are publicly readable"
  on public.reviews for select using (true);
create policy "Authenticated users can write reviews"
  on public.reviews for insert with check (auth.uid() = reviewer_id);

-- Messages: only sender/receiver
alter table public.messages enable row level security;
create policy "Messages visible to sender and receiver"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Authenticated users can send messages"
  on public.messages for insert with check (auth.uid() = sender_id);

-- ============================================================
-- 7. SAMPLE DATA (optional — remove in production)
-- ============================================================

-- Note: insert a real auth user first, then replace the UUID below.
-- Example seed for testing:
/*
insert into public.services (provider_id, title, category, description, price, price_unit, city, phone, tags) values
  ('YOUR-USER-UUID', 'Plombier urgence 24h/7j', 'Plomberie',
   'Intervention rapide pour toute urgence plomberie à Abidjan. Fuite d''eau, WC, douche. Devis gratuit.',
   15000, 'par intervention', 'Abidjan', '+2250700000001',
   ARRAY['urgence','plomberie','fuite','robinet']),

  ('YOUR-USER-UUID', 'Coiffure à domicile — tresses & lissage', 'Coiffure',
   'Coiffeuse professionnelle se déplaçant à domicile. Tresses, lissage, coloration. Produits de qualité.',
   8000, 'par séance', 'Abidjan', '+2250700000002',
   ARRAY['coiffure','tresses','lissage','domicile']),

  ('YOUR-USER-UUID', 'Électricien certifié — dépannage & installation', 'Électricité',
   'Électricien avec 8 ans d''expérience. Tableau électrique, prises, éclairage. Devis gratuit.',
   12000, 'par jour', 'Bouaké', '+2250700000003',
   ARRAY['électricité','dépannage','installation']);
*/
