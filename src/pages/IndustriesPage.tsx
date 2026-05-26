import React, { useEffect } from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { IndustryBar } from "@/components/landing/IndustryBar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingBackground } from "@/components/landing/LandingBackground";
import { Film, Clapperboard, Video, Music, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const IndustriesPage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const industries = [
        {
            title: "Hollywood",
            description: "Strict adherence to WGA standards. Perfect margins, accurate Scene Headings, and seamless character dialogue flow.",
            icon: <Film className="h-10 w-10 text-naija-green" />,
            tag: "Global Standard"
        },
        {
            title: "Nollywood",
            description: "Embracing the dynamic pacing of African cinema with flexible act structures tailored for rapid pre-production.",
            icon: <Clapperboard className="h-10 w-10 text-naija-gold" />,
            tag: "Dynamic Pacing"
        },
        {
            title: "Bollywood",
            description: "Integrated musical number formatting and extended timeline structuring to support epic multi-hour narratives.",
            icon: <Music className="h-10 w-10 text-naija-green" />,
            tag: "Epic Narratives"
        },
        {
            title: "Independent",
            description: "Built for speed. Auto-formatting allows indie creators to focus on the story instead of fighting with the layout.",
            icon: <Video className="h-10 w-10 text-naija-gold" />,
            tag: "Creative Freedom"
        }
    ];

    return (
        <div className="min-h-screen flex flex-col selection:bg-naija-green/30 relative">
            <LandingBackground />
            <LandingHeader />

            <main className="flex-1 pt-40 pb-24 relative z-10" role="main">
                <div className="max-w-4xl mx-auto px-6 mb-20 text-center">
                    <Badge variant="outline" className="mb-6 border-naija-green/30 text-naija-green bg-naija-green/5 px-4 py-1.5 rounded-full">
                        <Globe className="h-3 w-3 mr-2" />
                        Global Support
                    </Badge>
                    <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-8 tracking-tight">
                        Built for <span className="text-naija-green">Every</span> Industry
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Whether you are writing for Hollywood, Nollywood, Bollywood, or independent creators, 
                        Scriptyn adapts to your specific formatting and narrative needs.
                    </p>
                </div>

                <div className="mb-24">
                    <IndustryBar />
                </div>

                {/* Additional Industry Details */}
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {industries.map((item, idx) => (
                            <div key={idx} className="group relative h-full">
                                <div className="h-full bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 rounded-3xl flex flex-col gap-6 hover:border-naija-green/30 hover:bg-white/[0.05] transition-all duration-500 hover:-translate-y-2">
                                    <div className="bg-white/5 w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <Badge variant="secondary" className="mb-3 bg-white/5 text-gray-400 text-[10px] uppercase tracking-widest border-none">
                                            {item.tag}
                                        </Badge>
                                        <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">{item.title}</h3>
                                        <p className="text-gray-400 leading-relaxed text-sm">{item.description}</p>
                                    </div>
                                    
                                    {/* Bottom Decorative Line */}
                                    <div className="mt-auto pt-6">
                                        <div className="h-px w-full bg-gradient-to-r from-white/10 to-transparent" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <LandingFooter />
        </div>
    );
};

export default IndustriesPage;

