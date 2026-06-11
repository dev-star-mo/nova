-- Create reviews table if it doesn't already exist, or add new columns if it does

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  car_id uuid not null references public.cars (id) on delete cascade,
  booking_id uuid not null references public.bookings (id) on delete cascade,
  rating smallint not null check (rating >= 1 and rating <= 5),
  comment text,
  liked text,
  disliked text,
  complaints text,
  user_name text,
  created_at timestamptz not null default now(),
  unique(booking_id)
);

create index if not exists reviews_car_id_idx on public.reviews (car_id);

alter table public.reviews enable row level security;

create policy "reviews_public_read"
  on public.reviews for select
  using (true);

create policy "reviews_insert_own"
  on public.reviews for insert
  with check (auth.uid() = user_id);

create policy "reviews_update_own"
  on public.reviews for update
  using (auth.uid() = user_id);
