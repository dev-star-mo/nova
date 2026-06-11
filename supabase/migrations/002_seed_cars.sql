-- Sample fleet (Unsplash placeholders). Run after 001.

insert into public.cars (
  make, model, year, slug, price_per_day, price_per_week, price_per_month,
  location, image_url, images, description, features, seats, transmission, fuel_type, available
) values
(
  'Toyota', 'Camry Hybrid', 2024, 'toyota-camry-hybrid-2024', 85, 520, 1850,
  'Nairobi CBD',
  'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&q=80',
  array['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&q=80'],
  'Efficient hybrid sedan ideal for city driving and airport runs.',
  array['Adaptive cruise', 'LED headlights', 'Dual-zone climate', 'Apple CarPlay'],
  5, 'Automatic', 'Hybrid', true
),
(
  'Mercedes-Benz', 'E-Class', 2023, 'mercedes-e-class-2023', 195, 1200, 4200,
  'Westlands',
  'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80',
  array['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80'],
  'Executive chauffeur-ready saloon with refined comfort.',
  array['Leather seats', 'Ambient lighting', 'Burmester audio', 'Rear privacy glass'],
  5, 'Automatic', 'Petrol', true
),
(
  'Suzuki', 'Vitara', 2024, 'suzuki-vitara-2024', 72, 450, 1580,
  'Karen',
  'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80',
  array['https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80'],
  'Compact SUV for weekend trips and light off-road.',
  array['AWD option', 'Roof rails', 'High ground clearance', 'Fuel efficient'],
  5, 'Automatic', 'Petrol', true
),
(
  'Honda', 'CR-V', 2023, 'honda-crv-2023', 98, 610, 2150,
  'Mombasa Road',
  'https://images.unsplash.com/photo-1568844293986-8c040f476f18?w=800&q=80',
  array['https://images.unsplash.com/photo-1568844293986-8c040f476f18?w=800&q=80'],
  'Spacious family SUV with generous cargo room.',
  array['Honda Sensing', 'Panoramic roof', 'Power tailgate', '3-zone climate'],
  7, 'Automatic', 'Petrol', true
),
(
  'BMW', '3 Series', 2024, 'bmw-3-series-2024', 165, 1020, 3600,
  'Kilimani',
  'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80',
  array['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80'],
  'Sport-luxury sedan blending agility and premium tech.',
  array['Live cockpit', 'M sport package', 'Wireless charging', 'Parking assistant'],
  5, 'Automatic', 'Petrol', true
),
(
  'Toyota', 'Hiace 14-seater', 2022, 'toyota-hiace-14', 140, 880, 3100,
  'Industrial Area',
  'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80',
  array['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80'],
  'Group and corporate transport with ample seating.',
  array['Sliding doors', 'Rear AC', 'Luggage bay', 'Driver available on request'],
  14, 'Manual', 'Diesel', true
)
on conflict (slug) do nothing;
