
import React from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHero } from "@/components/landing/LandingHero";
import { IndustryBar } from "@/components/landing/IndustryBar";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] selection:bg-naija-green/30">
      <LandingHeader />

      <main className="flex-1" role="main" aria-label="ScriptLab: The AI Screenwriting Studio">
        <LandingHero />
        <IndustryBar />
        <FeatureGrid />

        {/* Additional cinematic section matching the bottom part of the mockup */}
        <section className="bg-black py-24 border-t border-white/5 relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">
              Ready to write your <span className="text-naija-gold">next big project?</span>
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/auth">
                <button className="bg-naija-green hover:bg-naija-green/90 text-white font-bold h-14 px-12 rounded-xl text-lg transition-all hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  Start Writing Your Film
                </button>
              </Link>
              <Link to="/auth" className="text-gray-400 hover:text-white font-semibold transition-colors">
                Generate Your First Scene
              </Link>
            </div>
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

