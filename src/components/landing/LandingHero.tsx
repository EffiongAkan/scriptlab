
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Sparkles, CheckCircle2 } from "lucide-react";

export const LandingHero: React.FC = () => {
    return (
        <section className="relative min-h-screen flex items-center pt-32 md:pt-20 overflow-hidden bg-[#0a0a0a]">
            {/* Background Image with Cinematic Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src="/landing/hero-bg.png"
                    alt="Cinematic Film Set"
                    className="w-full h-full object-cover opacity-60 mix-blend-luminosity"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#0a0a0a]" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-transparent to-transparent opacity-80" />
            </div>

            {/* Glowing Accents */}
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-naija-green/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-naija-gold/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 w-full relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                {/* Text Content */}
                <div className="animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6">
                        <Sparkles className="h-4 w-4 text-naija-gold" />
                        <span className="text-xs font-semibold text-gray-300 tracking-wider uppercase">AI-Powered Screenwriting</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-white leading-[1.1] mb-6">
                        The AI Screenwriting Studio for the <span className="bg-gradient-to-r from-naija-green to-naija-gold bg-clip-text text-transparent">Global Film Industry</span>
                    </h1>

                    <p className="text-xl text-gray-400 mb-10 max-w-xl leading-relaxed">
                        From idea to production-ready screenplay — with AI that understands structure, tracks continuity, and formats to industry standards.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                        <Button
                            asChild
                            className="bg-naija-green hover:bg-naija-green/90 text-white font-bold h-14 px-8 rounded-xl text-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all hover:scale-105"
                        >
                            <Link to="/auth">Start Writing Free</Link>
                        </Button>
                        <Button
                            asChild
                            variant="outline"
                            className="border-white/20 bg-white/5 hover:bg-white/10 text-white font-bold h-14 px-8 rounded-xl text-lg backdrop-blur-sm transition-all hover:border-naija-gold/50"
                        >
                            <Link to="/auth" className="flex items-center gap-2">
                                Generate a Film Concept
                            </Link>
                        </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 font-medium">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-naija-green" />
                            <span>No credit card required</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-naija-green" />
                            <span>Export-ready scripts</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-naija-green" />
                            <span>Trusted by Professionals</span>
                        </div>
                    </div>
                </div>

                {/* Floating Mockup Preview */}
                <div className="relative order-first lg:order-last">
                    <div className="relative z-10 animate-float translate-y-[-20px]">
                        <div className="absolute -inset-4 bg-gradient-to-r from-naija-green/20 to-naija-gold/20 blur-3xl rounded-[2rem] opacity-50" />
                        <img
                            src="/landing/editor-mockup.png"
                            alt="ScriptLab Editor Mockup"
                            className="relative rounded-2xl border border-white/10 shadow-2xl shadow-black"
                        />

                        {/* Floating Tags */}
                        <div className="absolute -top-4 md:-top-6 left-6 md:left-12 bg-black/60 backdrop-blur-md border border-white/20 rounded-lg px-4 py-2 flex items-center gap-3 animate-float-delayed shadow-xl z-20">
                            <div className="w-2 h-2 rounded-full bg-naija-gold animate-pulse" />
                            <span className="text-xs font-bold text-white uppercase tracking-tighter">Studio-Formatted</span>
                        </div>

                        <div className="absolute bottom-12 -right-4 md:-right-8 bg-black/60 backdrop-blur-md border border-white/20 rounded-lg px-4 py-2 flex items-center gap-3 animate-float shadow-xl z-20">
                            <div className="w-2 h-2 rounded-full bg-naija-green animate-pulse" />
                            <span className="text-xs font-bold text-white uppercase tracking-tighter">Continuity Aware</span>
                        </div>
                    </div>

                    {/* Circular Decorative Element */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-white/5 rounded-full pointer-events-none" />
                </div>
            </div>

        </section>
    );
};
