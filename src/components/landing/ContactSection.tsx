export function ContactSection() {
  return (
    <section id="contact" className="py-20 bg-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center font-display text-3xl font-bold text-ink">Contact</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-slate-600">
          Reach the NovaDrive team for quotes, fleet questions, or partnership enquiries.
        </p>
        <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="font-semibold text-ink">Phone</dt>
              <dd className="text-slate-600">
                <a href="tel:+254798615674" className="hover:text-brand-600">
                  +254 798 615 674
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Email</dt>
              <dd className="text-slate-600">
                <a href="mailto:novadrivecarlink@gmail.com" className="hover:text-brand-600">
                  novadrivecarlink@gmail.com
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Location</dt>
              <dd className="text-slate-600">Nairobi, Kenya</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
