-- NovaDrive CarLink — run in Supabase SQL Editor or via CLI
-- Profiles (1:1 with auth.users). role 'admin' grants admin UI access.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Cars (images: public URLs from Supabase Storage or external CDN)

create table if not exists public.cars (
  id uuid primary key default gen_random_uuid(),
  make text not null,
  model text not null,
  year int not null default extract(year from now())::int,
  slug text unique,
  price_per_day numeric(12,2) not null,
  price_per_week numeric(12,2),
  price_per_month numeric(12,2),
  location text not null default 'Nairobi',
  image_url text,
  images text[] default '{}',
  description text,
  features text[] default '{}',
  available boolean not null default true,
  seats int not null default 5,
  transmission text not null default 'Automatic',
  fuel_type text not null default 'Petrol',
  created_at timestamptz not null default now()
);

alter table public.cars enable row level security;

create policy "cars_public_read"
  on public.cars for select
  using (true);

create policy "cars_insert_admin"
  on public.cars for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "cars_update_admin"
  on public.cars for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "cars_delete_admin"
  on public.cars for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Bookings

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  car_id uuid not null references public.cars (id) on delete restrict,
  full_name text not null,
  phone text not null,
  email text not null,
  pickup_at timestamptz not null,
  return_at timestamptz not null,
  pickup_location text,
  dropoff_location text,
  rental_duration text not null,
  driving_mode text not null,
  special_requests text,
  total_amount numeric(12,2) not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'paid')),
  paystack_reference text,
  created_at timestamptz not null default now()
);

create index if not exists bookings_user_id_idx on public.bookings (user_id);
create index if not exists bookings_car_id_idx on public.bookings (car_id);

alter table public.bookings enable row level security;

create policy "bookings_select_own"
  on public.bookings for select
  using (auth.uid() = user_id);

create policy "bookings_insert_own"
  on public.bookings for insert
  with check (auth.uid() = user_id);

create policy "bookings_update_own"
  on public.bookings for update
  using (auth.uid() = user_id);

create policy "bookings_admin_select"
  on public.bookings for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "bookings_admin_update"
  on public.bookings for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- New user → profile row (role defaults to user; set admin manually in SQL for staff)

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'user'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Storage bucket for car photos (create bucket "car-images" as public in Dashboard if preferred)

-- To promote a user to admin (replace UUID):
-- update public.profiles set role = 'admin' where id = 'USER_UUID';
