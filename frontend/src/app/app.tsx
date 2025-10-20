import { Navbar } from "@/components/landingComp/Navbar";
import { Hero } from "@/components/landingComp/Hero";
import { BrokerIntegration } from "@/components/landingComp/BrokerIntegration";
import { VisualComparison } from "@/components/landingComp/VisualComparison";
import { Stats } from "@/components/landingComp/Stats";
import { Features } from "@/components/landingComp/Features";
import { DashboardPreview } from "@/components/landingComp/DashboardPreview";
import { HowItWorks } from "@/components/landingComp/HowItWorks";
import { BentoShowcase } from "@/components/landingComp/BentoShowcase";
import { AIInsights } from "@/components/landingComp/AIInsights";
import { Comparison } from "@/components/landingComp/Comparison";
import { Testimonials } from "@/components/landingComp/Testimonials";
import { Pricing } from "@/components/landingComp/Pricing";
import { ReferEarn } from "@/components/landingComp/ReferEarn";
import { Newsletter } from "@/components/landingComp/Newsletter";
import { Footer } from "@/components/landingComp/Footer";
import { FloatingCTA } from "@/components/landingComp/FloatingCTA";
import { ScrollProgress } from "@/components/landingComp/ScrollProgress";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <ScrollProgress />
      <Navbar />
      <Hero />
      <BrokerIntegration />
      <VisualComparison />
      <Stats />
      <Features />
      <DashboardPreview />
      <HowItWorks />
      <BentoShowcase />
      <AIInsights />
      <Comparison />
      <Testimonials />
      <Pricing />
      <ReferEarn />
      <Newsletter />
      <Footer />
      <FloatingCTA />
    </div>
  );
}
