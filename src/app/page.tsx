import { Suspense } from "react";
import { HeroSearch } from "@/components/landing/HeroSearch";
import { AboutSection } from "@/components/landing/AboutSection";
import { ServicesSection } from "@/components/landing/ServicesSection";
import { OffersSection, MidCtaSection } from "@/components/landing/OffersCtaSection";
import { FeaturedFleet } from "@/components/landing/FeaturedFleet";
import { ContactSection } from "@/components/landing/ContactSection";
import { Reveal } from "@/components/motion/Reveal";
import { VerifiedBanner } from "@/components/landing/VerifiedBanner";

export default function HomePage() {
  return (
    <>
      <Suspense>
        <VerifiedBanner />
      </Suspense>
      <HeroSearch />
      <Reveal>
        <FeaturedFleet />
      </Reveal>
      <Reveal>
        <AboutSection />
      </Reveal>
      <Reveal>
        <ServicesSection />
      </Reveal>
      <Reveal>
        <MidCtaSection />
      </Reveal>
      <Reveal>
        <OffersSection />
      </Reveal>
      <Reveal>
        <ContactSection />
      </Reveal>
    </>
  );
}
