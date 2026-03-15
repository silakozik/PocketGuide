import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { DashboardPreview } from "./components/DashboardPreview";
import { Ticker } from "./components/Ticker";
import { Features } from "./components/Features";
import { Transit } from "./components/Transit";
import { How } from "./components/How";
import { CTA } from "./components/CTA";
import { Footer } from "./components/Footer";

export default function App() {
  return (
    <>
      <Nav />
      <Hero />
      <DashboardPreview />
      <Ticker />
      <Features />
      <Transit />
      <How />
      <CTA />
      <Footer />
    </>
  );
}
