
import React from "react";

const industries = [
    "Hollywood",
    "Nollywood",
    "Bollywood",
    "UK Film",
    "Streaming",
    "Indie Cinema",
];

export const IndustryBar: React.FC = () => {
    return (
        <div className="bg-[#0a0a0a] py-12 border-y border-white/5">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
                    <div className="flex flex-wrap justify-center gap-x-12 gap-y-6">
                        {industries.map((industry) => (
                            <span
                                key={industry}
                                className="text-gray-500 font-semibold text-lg tracking-wide hover:text-gray-300 transition-colors cursor-default"
                            >
                                {industry}
                            </span>
                        ))}
                    </div>
                    <div className="h-px w-20 bg-white/10 hidden md:block" />
                    <p className="text-gray-400 font-medium">
                        One platform. <span className="text-naija-green font-bold">Multiple industry standards.</span>
                    </p>
                </div>
            </div>
        </div>
    );
};
