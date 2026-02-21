
import React from "react";
import { ScriptCreationFlow } from "./ScriptCreationFlow";

const placeholderImg =
  "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=660&q=80";

export const UpdatedHeroSection: React.FC = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Header */}
      <div className="relative flex flex-col-reverse md:flex-row items-center justify-between py-16 md:py-20">
        {/* TEXT COLUMN */}
        <div className="w-full md:w-1/2 text-center md:text-left z-10 px-0 md:px-4 animate-fade-in">
          <h1
            className="font-black text-4xl sm:text-5xl md:text-6xl leading-tight tracking-tight mb-6 text-gray-900 dark:text-white"
            aria-label="Welcome to ScriptLab - Creative African script platform"
          >
            Unleash{" "}
            <span className="bg-gradient-to-r from-green-800 to-yellow-400 bg-clip-text text-transparent">
              African Stories
            </span>{" "}
            on the big screen.
          </h1>
          <p className="mb-8 text-base xs:text-lg sm:text-xl text-gray-700 dark:text-gray-200 max-w-lg mx-auto md:mx-0">
            Turn your ideas into scripts with a modern editor rooted in African and Nigerian creativity.<br className="hidden md:inline" />
            Powerful AI, collaborative tools, and local storytelling inspiration—all in one beautiful workspace.
          </p>
          <div className="mt-7 text-sm text-muted-foreground font-medium">
            No sign-up required to try. Easy export for your screenplay.
          </div>
        </div>

        {/* IMAGE COLUMN */}
        <div className="relative w-full md:w-1/2 mb-12 md:mb-0 flex items-center justify-center">
          <div className="relative w-[320px] h-[380px] md:w-[420px] md:h-[480px] overflow-visible select-none">
            <div className="absolute -inset-x-8 -bottom-8 h-32 rounded-full blur-2xl opacity-10 bg-gradient-to-r from-naija-green via-yellow-200 to-naija-gold pointer-events-none" />
            <img
              src={placeholderImg}
              alt="Screenwriter working in Lagos"
              className="rounded-xl shadow-2xl ring-2 ring-naija-green/60 ring-offset-2 dark:ring-4 dark:ring-naija-gold-dark w-full h-full object-cover animate-scale-in"
              draggable={false}
            />
            {/* Accent sticker */}
            <div className="absolute top-4 left-4 bg-naija-gold rounded-full px-4 py-1 text-xs font-bold text-black shadow hover:scale-105 transition-transform">
              🎬 Nollywood Ready
            </div>
          </div>
        </div>
      </div>

      {/* Script Creation Flow */}
      <ScriptCreationFlow />
    </section>
  );
};
