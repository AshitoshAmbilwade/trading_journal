import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { BrokerIntegration } from "@/components/BrokerIntegration";
import { VisualComparison } from "@/components/VisualComparison";
import { Stats } from "@/components/Stats";
import { Features } from "@/components/Features";
import { DashboardPreview } from "@/components/DashboardPreview";
import { HowItWorks } from "@/components/HowItWorks";
import { BentoShowcase } from "@/components/BentoShowcase";
import { AIInsights } from "@/components/AIInsights";
import { Comparison } from "@/components/Comparison";
import { Testimonials } from "@/components/Testimonials";
import { Pricing } from "@/components/Pricing";
import { ReferEarn } from "@/components/ReferEarn";
import { Newsletter } from "@/components/Newsletter";
import { Footer } from "@/components/Footer";
import { FloatingCTA } from "@/components/FloatingCTA";
import { ScrollProgress } from "@/components/ScrollProgress";

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
