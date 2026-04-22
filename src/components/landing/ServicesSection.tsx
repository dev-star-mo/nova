const tiles = [
  { icon: "🗓️", title: "Flexible booking", desc: "Change plans with policies designed around real trips." },
  { icon: "✨", title: "Premium fleet", desc: "Late-model vehicles inspected before every handover." },
  { icon: "⚡", title: "Instant booking", desc: "Reserve in minutes with live availability." },
  { icon: "🛟", title: "24/7 service", desc: "Reach us any time for roadside and booking support." },
  { icon: "📍", title: "Multiple locations", desc: "Pick up and drop off across key hubs." },
  { icon: "👥", title: "Group / corporate rentals", desc: "Dedicated rates for teams and events." },
  { icon: "🛡️", title: "Full insurance", desc: "Comprehensive cover options for peace of mind." },
];

export function ServicesSection() {
  return (
    <section id="services" className="py-20 bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center font-display text-3xl font-bold text-ink">Our Services</h2>
        <p className="mx-auto mt-4 max-w-3xl text-center text-lg text-slate-600">
          Discover our comprehensive range of car rental services designed to meet all your
          transportation needs with the highest standards of quality and convenience.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tiles.map((t) => (
            <div
              key={t.title}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-brand-200"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 to-violet-500 opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-xl text-brand-700 ring-1 ring-brand-100">
                {t.icon}
              </div>
              <h3 className="font-display text-lg font-bold text-ink">{t.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{t.desc}</p>

            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
