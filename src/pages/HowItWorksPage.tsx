import React, { useEffect } from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingBackground } from "@/components/landing/LandingBackground";
import { Link } from "react-router-dom";
import { Shield, Zap, BookOpen, Layers, ArrowRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const HowItWorksPage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const steps = [
        {
            title: "Start Your Story",
            description: "Sign up and create your first script project. Use our distraction-free intuitive editor or let the AI assist you in generating an opening scene.",
            icon: <BookOpen className="h-10 w-10 text-naija-green" />,
            color: "from-naija-green/20 to-transparent"
        },
        {
            title: "Leverage AI Intelligence",
            description: "Need a plot twist or character dialogue? Use the Contextual Prompt Menu or the Plot Generator to instantly brainstorm ideas that match your story's DNA.",
            icon: <Zap className="h-10 w-10 text-naija-gold" />,
            color: "from-naija-gold/20 to-transparent"
        },
        {
            title: "Format Automatically",
            description: "Scriptyn automatically formats your text to industry standards (WGA) as you type. Focus on your creativity while we handle the margins and indents.",
            icon: <Layers className="h-10 w-10 text-naija-green" />,
            color: "from-naija-green/20 to-transparent"
        },
        {
            title: "Secure & Export",
            description: "Save snapshots via our built-in Version Control, collaborate with peers, and export your polished draft to PDF instantly—all backed by enterprise-grade security.",
            icon: <Shield className="h-10 w-10 text-naija-gold" />,
            color: "from-naija-gold/20 to-transparent"
        }
    ];

    return (
        <div className="min-h-screen flex flex-col selection:bg-naija-green/30 relative">
            <LandingBackground />
            <LandingHeader />

            <main className="flex-1 pt-40 pb-24 relative z-10" role="main">
                <div className="max-w-4xl mx-auto px-6 mb-24 text-center">
                    <Badge variant="outline" className="mb-6 border-naija-gold/30 text-naija-gold bg-naija-gold/5 px-4 py-1.5 rounded-full">
                        <Sparkles className="h-3 w-3 mr-2" />
                        The Process
                    </Badge>
                    <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-8 tracking-tight">
                        How <span className="text-naija-green">Scriptyn</span> Works
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        From a blank page to a pitch-ready screenplay in four simple steps. 
                        We take care of the formatting and complexity so you can focus on the story.
                    </p>
                </div>

                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                        {steps.map((step, idx) => (
                            <div key={idx} className="group relative">
                                <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2.5rem] -z-10`} />
                                <div className="h-full bg-white/[0.03] backdrop-blur-xl border border-white/10 p-10 rounded-[2.5rem] flex flex-col gap-6 hover:border-white/20 transition-all duration-300">
                                    <div className="bg-white/5 w-20 h-20 rounded-2xl flex items-center justify-center mb-2 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                        {step.icon}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-naija-green/40 font-mono text-xl font-bold">0{idx + 1}</span>
                                        <h3 className="text-3xl font-bold text-white">{step.title}</h3>
                                    </div>
                                    <p className="text-gray-400 text-lg leading-relaxed">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* CTA Section */}
                    <div className="mt-32 relative group overflow-hidden rounded-[3rem] border border-white/10 shadow-2xl shadow-naija-green/10">
                        {/* Studio background image */}
                        <div 
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105 opacity-40"
                            style={{ 
                                backgroundImage: `url('/assets/landing/studio_bg.png')`,
                            }} 
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent z-0" />
                        
                        <div className="relative z-10 backdrop-blur-[2px] p-16 md:p-24 text-center">
                            <h2 className="text-4xl md:text-5xl font-black text-white mb-8 tracking-tighter">Ready to tell your story?</h2>
                            <p className="text-gray-300 text-xl mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
                                Join the next generation of screenwriters and start creating today in your own virtual studio.
                            </p>
                            <Link to="/auth">
                                <button className="group/btn bg-naija-green hover:bg-naija-green/90 text-white font-bold h-16 px-12 rounded-2xl text-xl transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-naija-green/40 flex items-center gap-3 mx-auto border border-white/20">
                                    <span>Start Writing Now</span>
                                    <ArrowRight className="h-6 w-6 transition-transform group-hover/btn:translate-x-1" />
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            <LandingFooter />
        </div>
    );
};

export default HowItWorksPage;
