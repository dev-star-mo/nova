export function AboutSection() {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center font-display text-3xl font-bold text-ink">About NovaDrive</h2>
        <p className="mx-auto mt-6 max-w-3xl text-center text-lg text-slate-600 leading-relaxed">
          NovaDrive offers reliable, comfortable, and affordable vehicles tailored for every journey.
          Whether you&apos;re traveling for business, exploring the city, or heading out on an
          adventure, we provide a seamless rental experience with well-maintained cars and exceptional
          customer service. Drive with confidence, convenience, and peace of mind — NovaDrive has you
          covered every mile of the way.
        </p>
        <div className="mx-auto mt-14 max-w-2xl">
          <h3 className="text-left font-display text-2xl font-bold text-ink">Why choose NovaDrive</h3>
          <p className="mt-2 text-left text-slate-600">We are the best.</p>
          <ul className="mt-6 list-disc space-y-2 pl-6 text-left text-slate-700">
            <li>Instant booking confirmation</li>
            <li>24/7 customer support</li>
            <li>Premium and well-maintained fleet</li>
            <li>Competitive pricing</li>
            <li>Flexible rental periods</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
