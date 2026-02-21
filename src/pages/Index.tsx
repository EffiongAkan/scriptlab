
import React from "react";
import { HeroSection } from "@/components/landing/HeroSection";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-[#181c1b]">
      {/* Branding Header */}
      <header className="w-full bg-sidebar py-4 px-6 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <div className="bg-white p-1 rounded-md flex items-center justify-center">
            <img src="/brand/logo.png" alt="ScriptLab Logo" className="h-8 w-auto min-w-[32px]" />
          </div>
          <span className="text-white font-bold text-xl">ScriptLab</span>
        </div>
        <div className="flex gap-4">
          <Link to="/auth" className="text-white hover:text-naija-gold font-medium transition-colors">Sign In</Link>
          <Link to="/auth" className="bg-naija-gold text-black px-4 py-1 rounded-md font-bold hover:bg-naija-gold-dark transition-colors">Join Now</Link>
        </div>
      </header>

      <main
        className="flex-1 flex flex-col justify-center items-center px-0"
        role="main"
        aria-label="Welcome to ScriptLab: Creative African Script Editor"
      >
        <HeroSection />
      </main>
    </div>
  );
};

export default Index;
