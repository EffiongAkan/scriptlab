import React from "react";
import { Search, BrainCircuit, Download, ArrowRight } from "lucide-react";

export const HowItWorks: React.FC = () => {
    return (
        <section className="bg-[#0a0a0a] py-24 relative overflow-hidden border-t border-white/5">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-naija-gold/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-naija-green/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                        How <span className="text-naija-gold">Scriptyn</span> Works
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        A seamless workflow from an initial spark to a polished, industry-standard screenplay.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 relative">
                    {/* Connecting line for desktop */}
                    <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-naija-green/20 via-naija-gold/20 to-naija-green/20 -translate-y-1/2 z-0" />

                    {/* Step 1 */}
                    <div className="relative z-10 flex flex-col items-center text-center group">
                        <div className="w-20 h-20 rounded-2xl bg-[#1a1a1a] border border-white/10 flex items-center justify-center mb-6 relative overflow-hidden shadow-xl transition-transform group-hover:scale-110 group-hover:border-naija-green/50">
                            <div className="absolute inset-0 bg-gradient-to-br from-naija-green/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Search className="h-8 w-8 text-naija-green relative z-10" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">1. Import or Ideate</h3>
                        <p className="text-gray-400 text-sm leading-relaxed px-4">
                            Start fresh, import an existing draft, or paste a YouTube link to instantly extract a story.
                        </p>
                    </div>

                    {/* Step 2 */}
                    <div className="relative z-10 flex flex-col items-center text-center group">
                        <div className="w-20 h-20 rounded-2xl bg-[#1a1a1a] border border-white/10 flex items-center justify-center mb-6 relative overflow-hidden shadow-xl transition-transform group-hover:scale-110 group-hover:border-naija-gold/50">
                            <div className="absolute inset-0 bg-gradient-to-br from-naija-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <BrainCircuit className="h-8 w-8 text-naija-gold relative z-10" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">2. Analyze & Expand</h3>
                        <p className="text-gray-400 text-sm leading-relaxed px-4">
                            Let our AI assist you in analyzing pacing, building character arcs, and tracking continuity across scenes.
                        </p>
                    </div>

                    {/* Step 3 */}
                    <div className="relative z-10 flex flex-col items-center text-center group">
                        <div className="w-20 h-20 rounded-2xl bg-[#1a1a1a] border border-white/10 flex items-center justify-center mb-6 relative overflow-hidden shadow-xl transition-transform group-hover:scale-110 group-hover:border-white/50">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Download className="h-8 w-8 text-white relative z-10" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">3. Format & Export</h3>
                        <p className="text-gray-400 text-sm leading-relaxed px-4">
                            Your script is automatically formatted to studio standards. Export to PDF, FDX, or plain text instantly.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};
