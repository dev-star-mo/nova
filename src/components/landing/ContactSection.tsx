import { Phone, Mail, MapPin } from "lucide-react";

const CONTACTS = [
  {
    icon: Phone,
    label: "Phone",
    value: "+254 733 555 638",
    href: "tel:+254733555638",
  },
  {
    icon: Mail,
    label: "Email",
    value: "business@novadriverentacar.com",
    href: "mailto:business@novadriverentacar.com",
  },
  {
    icon: MapPin,
    label: "Location",
    value: "Westlands, Mogotio Road 16, Suit 004",
    href: "https://maps.app.goo.gl/3LmSSwmJiaqtEPkM6",
  },
];

const WHATSAPP_MESSAGE =
  "Hello NovaDrive! I'd like to inquire about renting a car. Could you please share availability and pricing?";

export function ContactSection() {
  return (
    <section id="contact" className="py-28 bg-onyx-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(197,160,89,0.07),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(197,160,89,0.05),transparent_60%)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px flex-1 max-w-16 bg-brand-600/30" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-600">Connect With Us</span>
            <div className="h-px flex-1 max-w-16 bg-brand-600/30" />
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-black text-white uppercase tracking-tight">
            Get In <span className="text-brand-600">Touch</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm text-slate-400 font-medium leading-relaxed">
            Reach the NovaDrive team for quotes, fleet questions, or partnership enquiries.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
          {CONTACTS.map(({ icon: Icon, label, value, href }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="group relative rounded-[2rem] bg-onyx-900 border border-white/5 p-8 hover:border-brand-600/30 hover:bg-onyx-800 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand-600/10 flex flex-col items-center text-center gap-4 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="h-14 w-14 rounded-[1.25rem] bg-onyx-950 border border-white/5 flex items-center justify-center shrink-0 shadow-xl group-hover:bg-brand-600 group-hover:border-brand-600 transition-all duration-500 relative z-10">
                <Icon className="h-6 w-6 text-brand-600 group-hover:text-white transition-colors duration-500" />
              </div>
              <div className="relative z-10">
                <dt className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">{label}</dt>
                <dd className="text-sm font-bold text-white leading-relaxed group-hover:text-brand-600 transition-colors duration-300">{value}</dd>
              </div>
            </a>
          ))}

          {/* WhatsApp Card */}
          <a
            href={`https://wa.me/254733555638?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative rounded-[2rem] bg-onyx-900 border border-white/5 p-8 hover:border-[#25D366]/40 hover:bg-onyx-800 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#25D366]/10 flex flex-col items-center text-center gap-4 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#25D366]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="h-14 w-14 rounded-[1.25rem] bg-onyx-950 border border-white/5 flex items-center justify-center shrink-0 shadow-xl group-hover:bg-[#25D366] group-hover:border-[#25D366] transition-all duration-500 relative z-10">
              {/* WhatsApp SVG icon */}
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-6 w-6 text-[#25D366] group-hover:text-white transition-colors duration-500"
                aria-hidden="true"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </div>
            <div className="relative z-10">
              <dt className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">WhatsApp</dt>
              <dd className="text-sm font-bold text-white leading-relaxed group-hover:text-[#25D366] transition-colors duration-300">+254 733 555 638</dd>
            </div>
          </a>
        </div>

      </div>
    </section>
  );
}
