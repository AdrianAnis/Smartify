import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Pricing } from "@/components/landing/Pricing";
import { Faq } from "@/components/landing/Faq";
import { CtaSection } from "@/components/landing/CtaSection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingMotion } from "@/components/landing/LandingMotion";
import "@/components/landing/landing.css";

export default function Home() {
  return (
    <div className="landing-page" id="top">
      <LandingMotion />
      <a className="landing-skip" href="#konten">Langsung ke konten</a>
      <LandingNavbar />
      <main id="konten">
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
        <Faq />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
