import Image from "next/image";
import Link from "next/link";

const services = [
  {
    title: "Group / Corporate Travel",
    desc: "Reliable group transport for teams, events, conferences, and delegations — with flexible scheduling and dedicated support.",
    bullets: ["Airport & hotel transfers", "Daily/weekly corporate rentals", "Team shuttles & events", "Dedicated account support"],
    image:
      "https://www.elinerstourscarhire.com/coaster-bus-for-group-travel.webp",
  },
  {
    title: "Safari / Game Drive",
    desc: "Comfort-first vehicles suited for long drives, mixed terrain, and multi-day trips — with optional chauffeur support.",
    bullets: ["4x4/SUV options", "Multi-day packages", "Route planning help", "Child seats on request"],
    image:
      "https://mlzkqf6h7v50.i.optimole.com/w:411/h:274/q:mauto/dpr:2.6/f:best/https://africompasstravel.com/wp-content/uploads/2025/03/Untitled-design-4-scaled.png",
  },
  {
    title: "Premium Fleet",
    desc: "Executive-ready vehicles for special occasions, business travel, and VIP movement — clean, discreet, and on time.",
    bullets: ["Executive saloons and 4X4's", "Chauffeured option", "Priority support", "Premium comfort"],
    image:
      "https://taroskaexecutives.com/wp-content/uploads/slider/cache/d8453786a24b0d0bcd9ff77e0b65fbd4/image3.jpg",
  },
  {
    title: "Airport Transfers",
    desc: "Door-to-door pickups and drop-offs across Nairobi and key hubs, with transparent rates and professional service.",
    bullets: ["JKIA / Wilson pickups", "Meet & greet (optional)", "Late-night availability", "Luggage-friendly vehicles"],
    image:
      "https://media-cdn.tripadvisor.com/media/attractions-splice-spp-674x446/0a/cd/2a/ae.jpg",
  },
];

export default function ServicesPage() {
  return (
    <div className="bg-white">
      <section className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            Services built around your trip
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600">
            From corporate movement to safari adventures, NovaDrive provides dependable vehicles,
            flexible scheduling, and support you can reach when it matters.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/cars"
              className="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
            >
              Browse fleet
            </Link>
            <Link
              href="/#contact"
              className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:bg-slate-50 transition-colors"
            >
              Talk to us
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:gap-8">
            {services.map((s) => (
              <div
                key={s.title}
                className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-2 lg:items-center lg:p-10"
              >
                <div className="order-2 lg:order-1">
                  <h2 className="font-display text-2xl font-bold text-ink">{s.title}</h2>
                  <p className="mt-3 text-slate-600">{s.desc}</p>
                  <ul className="mt-5 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                    {s.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-600" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6">
                    <Link
                      href="/cars"
                      className="inline-flex items-center rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100 transition-colors"
                    >
                      Book a vehicle
                    </Link>
                  </div>
                </div>

                <div className="order-1 lg:order-2">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100">
                    <Image
                      src={s.image}
                      alt={s.title}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 520px, 100vw"
                      priority={s.title === "Group / Corporate Travel"}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

