import { Nav } from "@/components/Nav";
import { Hero } from "@/components/sections/Hero";
import { AreYouOwed } from "@/components/sections/AreYouOwed";
import { Calculator } from "@/components/sections/Calculator";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { WarCancellations } from "@/components/sections/WarCancellations";
import { VsOthers } from "@/components/sections/VsOthers";
import { Testimonials } from "@/components/sections/Testimonials";
import { Trust } from "@/components/sections/Trust";
import { FAQ } from "@/components/sections/FAQ";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Footer } from "@/components/sections/Footer";

export default function Page() {
  return (
    <main dir="rtl" className="bg-terminal">
      <Nav />
      <Hero />
      <AreYouOwed />
      <Calculator />
      <HowItWorks />
      <WarCancellations />
      <VsOthers />
      <Testimonials />
      <Trust />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
