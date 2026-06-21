import Link from "next/link";
import Image from "next/image";

const PHONE = "+254 798 615 674" + " , " + "+254 733 555 638";
const EMAIL = "novadrivecarlink@gmail.com";
const LOCATION = "Westlands, Mogotio Road 16, Suit 004";
const MAPS_URL = "https://maps.app.goo.gl/3LmSSwmJiaqtEPkM6";

export function SiteFooter() {
  return (
    <footer className="border-t border-onyx-800 bg-onyx-950 text-slate-400">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8">
        <div className="space-y-6">
          <Link href="/" className="flex items-center gap-3 text-white group">
            <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-brand-600 p-2 shadow-lg transition-transform duration-300 group-hover:scale-110">
              <Image
                src="/logo.png"
                alt="NovaDrive Logo"
                fill
                className="object-contain p-1.5"
              />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">NovaDrive <span className="text-brand-600">Logistics</span></span>
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-slate-500">
            Pioneering premium mobility and logistics-focused rental solutions across Kenya with elegance and precision.
          </p>
          <div className="flex gap-4">
            {[
              { href: "https://www.facebook.com/people/NovaDrive-CarLink-Solutions/61552707059895/?locale=ro_RO#", label: "Facebook", icon: <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /> },
              { href: "https://www.instagram.com/novadrive_logistics?igsh=MWw4NGtpNWd5OHowYQ==", label: "Instagram", icon: <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16.4a4.238 4.238 0 110-8.476 4.238 4.238 0 010 8.476zm5.83-10.233a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z" /> },
              { href: "https://vm.tiktok.com/ZS92W2tQ1PtN7-yBWEz/", label: "TikTok", icon: <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.29 6.29 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.93a8.19 8.19 0 004.78 1.52V7.01a4.85 4.85 0 01-1.01-.32z" /> },
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-onyx-900 p-2.5 text-slate-500 hover:bg-brand-600 hover:text-white transition-all duration-300"
                aria-label={social.label}
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">{social.icon}</svg>
              </a>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-widest text-brand-600">Explore</h3>
          <ul className="mt-8 space-y-4 text-sm font-medium">
            {[
              { href: "/", label: "Home" },
              { href: "/#about", label: "About Us" },
              { href: "/services", label: "Our Services" },
              { href: "/lease", label: "Lease Your Car" },
              { href: "/cars", label: "Premium Fleet" },
            ].map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="hover:text-brand-600 transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-onyx-900 bg-onyx-950 py-8 text-center text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-slate-600">
        © {new Date().getFullYear()} NovaDrive <span className="text-brand-600">Logistics</span>. Crafted for Excellence.
      </div>
    </footer>
  );
}
