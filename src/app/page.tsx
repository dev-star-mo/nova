import { HeroSearch } from "@/components/landing/HeroSearch";
import { AboutSection } from "@/components/landing/AboutSection";
import { ServicesSection } from "@/components/landing/ServicesSection";
import { OffersSection, MidCtaSection } from "@/components/landing/OffersCtaSection";
import { FeaturedFleet } from "@/components/landing/FeaturedFleet";
import { ContactSection } from "@/components/landing/ContactSection";
import { Reveal } from "@/components/motion/Reveal";

export default function HomePage() {
  return (
    <>
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
