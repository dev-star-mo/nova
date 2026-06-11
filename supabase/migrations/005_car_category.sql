-- Add category column to cars table
-- Categories: small_car, mid_sized_car, suv, luxury, corporate_group

alter table public.cars
  add column if not exists category text default 'small_car'
    check (category in ('small_car', 'mid_sized_car', 'suv', 'luxury', 'corporate_group'));
