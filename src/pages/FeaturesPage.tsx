import React, { useEffect } from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { LandingFooter } from "@/components/landing/LandingFooter";

const FeaturesPage = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-[#0a0a0a] selection:bg-naija-green/30">
            <LandingHeader />

            <main className="flex-1 pt-32 pb-16" role="main">
                <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">Our Features</h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">Explore the powerful toolset designed for professional screenwriters and creators.</p>
                </div>
                <FeatureGrid />
            </main>

            <LandingFooter />
        </div>
    );
};

export default FeaturesPage;
