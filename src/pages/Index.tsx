
import React from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHero } from "@/components/landing/LandingHero";
import { IndustryBar } from "@/components/landing/IndustryBar";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] selection:bg-naija-green/30">
      <LandingHeader />

      <main className="flex-1" role="main" aria-label="Scriptyn: The AI Screenwriting Studio">
        <LandingHero />
        <IndustryBar />
        <FeatureGrid />

        <HowItWorks />

        {/* Additional cinematic section matching the bottom part of the mockup */}
        <section className="bg-black py-32 border-t border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 z-0">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[300px] bg-gradient-to-r from-naija-green/20 via-naija-gold/20 to-naija-green/20 blur-[100px] opacity-30 pointer-events-none" />
          </div>
          
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-8 tracking-tight">
              Ready to write your <span className="bg-gradient-to-r from-naija-green to-naija-gold bg-clip-text text-transparent">next big project?</span>
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-6">
              <Link to="/auth">
                <button className="bg-naija-green hover:bg-naija-green/90 text-white font-bold h-16 px-14 rounded-xl text-xl transition-all hover:scale-105 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)]">
                  Start Writing Your Film
                </button>
              </Link>
            </div>
            <p className="text-gray-400 font-medium">No credit card required. Start creating instantly.</p>
          </div>

          {/* Subtle glow effect */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-t from-naija-green/10 to-transparent pointer-events-none" />
        </section>
      </main>

      <LandingFooter />
    </div>
  );
};

export default Index;

