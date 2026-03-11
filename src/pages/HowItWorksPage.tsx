import React, { useEffect } from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Link } from "react-router-dom";
import { Shield, Zap, BookOpen, Layers } from "lucide-react";

const HowItWorksPage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const steps = [
        {
            title: "1. Start Your Story",
            description: "Sign up and create your first script project. Use our distraction-free intuitive editor or let the AI assist you in generating an opening scene.",
            icon: <BookOpen className="h-8 w-8 text-naija-green" />
        },
        {
            title: "2. Leverage AI Intelligence",
            description: "Need a plot twist or character dialogue? Use the Contextual Prompt Menu or the Plot Generator to instantly brainstorm ideas that match your story's DNA.",
            icon: <Zap className="h-8 w-8 text-naija-gold" />
        },
        {
            title: "3. Format Automatically",
            description: "ScriptLab automatically formats your text to industry standards (WGA) as you type. Focus on your creativity while we handle the margins and indents.",
            icon: <Layers className="h-8 w-8 text-naija-green" />
        },
        {
            title: "4. Secure & Export",
            description: "Save snapshots via our built-in Version Control, collaborate with peers, and export your polished draft to PDF instantly—all backed by enterprise-grade security.",
            icon: <Shield className="h-8 w-8 text-naija-gold" />
        }
    ];

    return (
        <div className="min-h-screen flex flex-col bg-[#0a0a0a] selection:bg-naija-green/30">
            <LandingHeader />

            <main className="flex-1 pt-32 pb-24" role="main">
                <div className="max-w-4xl mx-auto px-6 mb-16 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">How ScriptLab Works</h1>
                    <p className="text-xl text-gray-400">From a blank page to a pitch-ready screenplay in four simple steps.</p>
                </div>

                <div className="max-w-5xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {steps.map((step, idx) => (
                            <div key={idx} className="bg-black/40 border border-white/5 p-8 rounded-2xl flex flex-col gap-4 hover:border-naija-green/30 transition-all duration-300">
                                <div className="bg-white/5 w-16 h-16 rounded-xl flex items-center justify-center mb-4">
                                    {step.icon}
                                </div>
                                <h3 className="text-2xl font-bold text-white">{step.title}</h3>
                                <p className="text-gray-400 leading-relaxed">{step.description}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-20 text-center bg-gradient-to-tr from-naija-green/10 to-transparent border border-white/10 p-12 rounded-3xl">
                        <h2 className="text-3xl font-bold text-white mb-6">Ready to see it in action?</h2>
                        <Link to="/auth">
                            <button className="bg-naija-green hover:bg-naija-green/90 text-white font-bold h-14 px-10 rounded-xl text-lg transition-all hover:scale-105 shadow-lg shadow-naija-green/20">
                                Start Writing Now
                            </button>
                        </Link>
                    </div>
                </div>
            </main>

            <LandingFooter />
        </div>
    );
};

export default HowItWorksPage;
