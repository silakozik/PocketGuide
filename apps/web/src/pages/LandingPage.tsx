import { Nav } from "../components/Nav";
import { Hero } from "../components/Hero";
import { DashboardPreview } from "../components/DashboardPreview";
import { Ticker } from "../components/Ticker";
import { Features } from "../components/Features";
import { SocialProof } from "../components/SocialProof";
import { Transit } from "../components/Transit";
import { How } from "../components/How";
import { Pricing } from "../components/Pricing";
import { CTA } from "../components/CTA";
import { Footer } from "../components/Footer";

export default function LandingPage() {
  return (
    <>
      <Nav />
      <Hero />
      <DashboardPreview />
      <Ticker />
      <Features />
      <SocialProof />
      <Transit />
      <How />
      <Pricing />
      <CTA />
      <Footer />
    </>
  );
}
