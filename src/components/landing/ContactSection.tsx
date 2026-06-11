import { Phone, Mail, MapPin } from "lucide-react";

const CONTACTS = [
  {
    icon: Phone,
    label: "Phone",
    value: "+254 798 615 674  /  +254 733 555 638",
    href: "tel:+254798615674",
  },
  {
    icon: Mail,
    label: "Email",
    value: "novadrivecarlink@gmail.com",
    href: "mailto:novadrivecarlink@gmail.com",
  },
  {
    icon: MapPin,
    label: "Location",
    value: "NovaDrive CarLink Solutions, Nairobi, Kenya",
    href: "https://maps.app.goo.gl/3LmSSwmJiaqtEPkM6",
  },
];

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
        <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
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
        </div>

      </div>
    </section>
  );
}
