import React, { useEffect } from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { IndustryBar } from "@/components/landing/IndustryBar";
import { LandingFooter } from "@/components/landing/LandingFooter";

const IndustriesPage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-[#0a0a0a] selection:bg-naija-green/30">
            <LandingHeader />

            <main className="flex-1 pt-32 pb-24" role="main">
                <div className="max-w-4xl mx-auto px-6 mb-16 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">Built for Every Industry</h1>
                    <p className="text-xl text-gray-400">Whether you are writing for Hollywood, Nollywood, Bollywood, or independent creators, ScriptLab adapts to your specific formatting and narrative needs.</p>
                </div>

                <IndustryBar />

                {/* Additional Industry Details */}
                <div className="max-w-7xl mx-auto px-6 mt-24">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Hollywood */}
                        <div className="bg-black/40 border border-white/5 p-8 rounded-xl hover:border-white/10 transition-colors">
                            <h3 className="text-2xl font-bold text-white mb-4">Hollywood</h3>
                            <p className="text-gray-400">Strict adherence to WGA standards. Perfect margins, accurate Scene Headings, and seamless character dialogue flow.</p>
                        </div>
                        {/* Nollywood */}
                        <div className="bg-black/40 border border-white/5 p-8 rounded-xl hover:border-white/10 transition-colors">
                            <h3 className="text-2xl font-bold text-white mb-4">Nollywood</h3>
                            <p className="text-gray-400">Embracing the dynamic pacing of African cinema with flexible act structures tailored for rapid pre-production.</p>
                        </div>
                        {/* Bollywood */}
                        <div className="bg-black/40 border border-white/5 p-8 rounded-xl hover:border-white/10 transition-colors">
                            <h3 className="text-2xl font-bold text-white mb-4">Bollywood</h3>
                            <p className="text-gray-400">Integrated musical number formatting and extended timeline structuring to support epic multi-hour narratives.</p>
                        </div>
                        {/* Independent */}
                        <div className="bg-black/40 border border-white/5 p-8 rounded-xl hover:border-white/10 transition-colors">
                            <h3 className="text-2xl font-bold text-white mb-4">Independent</h3>
                            <p className="text-gray-400">Built for speed. Auto-formatting allows indie creators to focus on the story instead of fighting with the layout.</p>
                        </div>
                    </div>
                </div>
            </main>

            <LandingFooter />
        </div>
    );
};

export default IndustriesPage;
