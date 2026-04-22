import Link from "next/link";

const PHONE = "+254 798 615 674" + " , " + "+254 733 555 638";
const EMAIL = "novadrivecarlink@gmail.com";
const LOCATION = "NovaDrive HQ, Nairobi, Kenya";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <div className="flex items-center gap-2 text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold">
              N
            </span>
            <span className="font-display text-lg font-semibold">NovaDrive CarLink Solutions</span>
          </div>
          <p className="mt-3 text-sm text-slate-400">
            Reliable mobility and logistics-focused rental solutions across the region.
          </p>
          <div className="mt-4 flex gap-4">
            <a
              href="https://www.facebook.com/people/NovaDrive-CarLink-Solutions/61552707059895/?locale=ro_RO#"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-brand-400"
              aria-label="Facebook"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-brand-400"
              aria-label="Instagram"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16.4a4.238 4.238 0 110-8.476 4.238 4.238 0 010 8.476zm5.83-10.233a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z"/></svg>
            </a>
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-brand-400"
              aria-label="TikTok"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31 0 2.591.311 3.738.834.428.183.844.407 1.246.669.176.115.348.237.514.364v4.444c-.75-.544-1.616-.894-2.55-1.02-.315-.043-.637-.064-.963-.064V9.66c0 1.763-.83 3.328-2.115 4.316a5.52 5.52 0 01-3.398 1.158c-3.045 0-5.514-2.469-5.514-5.514 0-3.045 2.469-5.514 5.514-5.514.321 0 .633.027.935.08v3.473c-.3-.05-.609-.08-.923-.08-.57 0-1.096.11-1.573.31a2.808 2.808 0 00-1.42 1.455c-.244.572-.375 1.196-.375 1.848 0 2.503 2.03 4.533 4.533 4.533 2.503 0 4.533-2.03 4.533-4.533V0h3.585c.18 1.417.842 2.68 1.854 3.633.914.862 2.1 1.416 3.411 1.545v3.666c-1.53-.131-2.91-.767-3.955-1.74a6.764 6.764 0 01-1.39-1.856V.02h-4.225z"/></svg>
            </a>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Quick links</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/" className="hover:text-white">
                Home
              </Link>
            </li>
            <li>
              <Link href="/#about" className="hover:text-white">
                About us
              </Link>
            </li>
            <li>
              <Link href="/services" className="hover:text-white">
                Our services
              </Link>
            </li>
            <li>
              <Link href="/lease" className="hover:text-white">
                Lease your car
              </Link>
            </li>
            <li>
              <Link href="/cars" className="hover:text-white">
                Our fleet
              </Link>
            </li>
            <li>
              <Link href="/#contact" className="hover:text-white">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Get in touch</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a href={`tel:${PHONE.replace(/\s/g, "")}`} className="hover:text-white">
                {PHONE}
              </a>
            </li>
            <li>
              <a href={`mailto:${EMAIL}`} className="hover:text-white">
                {EMAIL}
              </a>
            </li>
            <li>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(LOCATION)}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                {LOCATION}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} NovaDrive CarLink Solutions. All rights reserved.
      </div>
    </footer>
  );
}
