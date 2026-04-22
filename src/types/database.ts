export type Profile = {
  id: string;
  full_name: string | null;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
};

export type CarCategory = 'small_car' | 'mid_sized_car' | 'suv' | 'luxury' | 'corporate_group';

export const CAR_CATEGORIES: { value: CarCategory; label: string; icon: string }[] = [
  { value: 'small_car', label: 'Small Car', icon: '🚗' },
  { value: 'mid_sized_car', label: 'Mid-Sized Car', icon: '🚙' },
  { value: 'suv', label: 'SUV', icon: '🚐' },
  { value: 'luxury', label: 'Luxury', icon: '🏎️' },
  { value: 'corporate_group', label: 'Corporate / Group', icon: '🚌' },
];

export type Car = {
  id: string;
  make: string;
  model: string;
  year: number;
  slug: string | null;
  category?: CarCategory | null;
  price_per_day: number;
  price_per_week: number | null;
  price_per_month: number | null;
  location: string;
  image_url: string | null;
  images: string[] | null;
  description: string | null;
  features: string[] | null;
  available: boolean;
  seats: number;
  transmission: string;
  fuel_type: string;
  units_available: number;
  created_at: string;
};

export type Booking = {
  id: string;
  user_id: string;
  car_id: string;
  full_name: string;
  phone: string;
  email: string;
  pickup_at: string;
  return_at: string;
  pickup_location: string | null;
  dropoff_location: string | null;
  rental_duration: string;
  driving_mode: string;
  special_requests: string | null;
  total_amount: number;
  status: string;
  paystack_reference: string | null;
  created_at: string;
};

export type LeaseRequest = {
  id: string;
  user_id: string;
  brand: string;
  model: string;
  year: number;
  mileage_km: number;
  image_url: string | null;
  image_urls: string[] | null;
  phone_numbers: string[] | null;
  user_full_name: string | null;
  user_email: string | null;
  lease_duration_months: number | null;
  status: "new" | "reviewing" | "accepted" | "rejected";
  created_at: string;
};

export type Review = {
  id: string;
  user_id: string;
  car_id: string;
  booking_id: string;
  rating: number;
  comment: string | null;
  liked: string | null;
  disliked: string | null;
  complaints: string | null;
  created_at: string;
  user_name: string;
  // Joined fields (populated in admin view)
  user_email?: string | null;
  car_make?: string | null;
  car_model?: string | null;
  car_year?: number | null;
  pickup_at?: string | null;
  return_at?: string | null;
  pickup_location?: string | null;
  dropoff_location?: string | null;
};

export type BookingWithCar = Booking & {
  car_make?: string | undefined;
  car_model?: string | undefined;
};
