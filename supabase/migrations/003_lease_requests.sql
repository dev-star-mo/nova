-- Lease requests (user-submitted vehicle leasing form)

create table if not exists public.lease_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  brand text not null,
  model text not null,
  year int not null,
  mileage_km int not null,
  image_url text not null,
  status text not null default 'new' check (status in ('new', 'reviewing', 'accepted', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists lease_requests_user_id_idx on public.lease_requests (user_id);

alter table public.lease_requests enable row level security;

create policy "lease_requests_select_own"
  on public.lease_requests for select
  using (auth.uid() = user_id);

create policy "lease_requests_insert_own"
  on public.lease_requests for insert
  with check (auth.uid() = user_id);

create policy "lease_requests_admin_select"
  on public.lease_requests for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "lease_requests_admin_update"
  on public.lease_requests for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

