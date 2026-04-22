export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { CarListing } from "@/components/cars/CarListing";
import type { Car } from "@/types/database";

type Search = { [key: string]: string | string[] | undefined };

export default async function CarsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const name = typeof sp.name === "string" ? sp.name : "";
  const location = typeof sp.location === "string" ? sp.location : "";
  const from = typeof sp.from === "string" ? sp.from : "";
  const to = typeof sp.to === "string" ? sp.to : "";

  const supabase = await createClient();
  const { data } = await supabase.from("cars").select("*").order("make");

  return (
    <CarListing
      initialCars={(data as Car[]) ?? []}
      initialQuery={name}
      initialLocation={location}
      initialFrom={from}
      initialTo={to}
    />
  );
}
