
import React from "react";
import { Brain, FileText, Globe, Check } from "lucide-react";

const features = [
    {
        title: "Intelligent Story Engine",
        icon: <Brain className="h-6 w-6 text-naija-gold" />,
        image: "/landing/feature-story.png",
        description: "AI-driven plot generation and continuity tracking for complex narrative arcs.",
        items: ["Character & plot continuity", "Scene batch generation", "Genre & tone control"],
    },
    {
        title: "Industry Formatting",
        icon: <FileText className="h-6 w-6 text-naija-green" />,
        image: "/landing/feature-format.png",
        description: "Automatic formatting to Hollywood, Nollywood, and global industry standards.",
        items: ["Feature, TV, Streaming, Stage", "Production-ready export", "Professional standards"],
    },
    {
        title: "Global Story DNA",
        icon: <Globe className="h-6 w-6 text-blue-400" />,
        image: "/landing/feature-global.png",
        description: "Tools designed for culturally rich storytelling with local context awareness.",
        items: ["Cultural tone adaptation", "Local dialogue when needed", "Universal storytelling logic"],
    },
];

export const FeatureGrid: React.FC = () => {
    return (
        <section className="bg-[#0a0a0a] py-24 relative overflow-hidden">
            {/* Cinematic Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src="/landing/features-bg.png"
                    alt="Film Set Background"
                    className="w-full h-full object-cover opacity-20 mix-blend-luminosity"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-transparent to-[#0a0a0a]" />
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 animate-fade-in-up">
                        From <span className="text-naija-green">Idea</span> to <span className="text-white">Screen</span> in Minutes
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto animate-fade-in-up delay-100">
                        ScriptLab combines cutting-edge AI with deep industry knowledge to give you a professional edge.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {features.map((feature, idx) => (
                        <div
                            key={idx}
                            className="group relative flex flex-col rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/[0.08] transition-all hover:-translate-y-2 overflow-hidden animate-fade-in-up"
                            style={{ animationDelay: `${(idx + 2) * 100}ms` }}
                        >
                            <div className="absolute -inset-px bg-gradient-to-b from-white/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none" />

                            {/* Feature Image Container */}
                            <div className="h-48 overflow-hidden relative">
                                <img
                                    src={feature.image}
                                    alt={feature.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                <div className="absolute bottom-4 left-6 flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-black/40 backdrop-blur-sm border border-white/10">
                                        {feature.icon}
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 pt-6 relative flex-1">
                                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                                <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                                    {feature.description}
                                </p>

                                <ul className="space-y-3">
                                    {feature.items.map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-naija-green/20 flex items-center justify-center">
                                                <Check className="h-3 w-3 text-naija-green" />
                                            </div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
