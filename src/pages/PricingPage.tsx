import React, { useState, useEffect } from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingBackground } from "@/components/landing/LandingBackground";
import { Badge } from '@/components/ui/badge';
import { Crown, Star, Check, ArrowRight } from 'lucide-react';
import { Link } from "react-router-dom";
import { SUBSCRIPTION_PLANS } from '@/constants/subscriptionPlans';

const PricingPage = () => {
    const [selectedInterval, setSelectedInterval] = useState<'month' | 'year'>('month');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen flex flex-col selection:bg-naija-green/30 relative">
            <LandingBackground />
            <LandingHeader />

            <main className="flex-1 pt-40 pb-24 relative z-10" role="main">
                <div className="max-w-4xl mx-auto px-6 mb-20 text-center">
                    <Badge variant="outline" className="mb-6 border-naija-green/30 text-naija-green bg-naija-green/5 px-4 py-1.5 rounded-full">
                        Flexible Options
                    </Badge>
                    <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-8 tracking-tight">
                        Simple, <span className="text-naija-green">Transparent</span> Pricing
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Choose the perfect plan for your screenwriting journey. 
                        Join thousands of writers using Scriptyn to tell their stories.
                    </p>
                </div>

                {/* Interval Toggle */}
                <div className="flex justify-center mb-16">
                    <div className="flex items-center bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-1.5 gap-1.5">
                        <button
                            className={`px-8 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${selectedInterval === 'month' ? 'bg-naija-green text-white shadow-lg shadow-naija-green/20' : 'text-gray-400 hover:text-white'}`}
                            onClick={() => setSelectedInterval('month')}
                        >
                            Monthly
                        </button>
                        <button
                            className={`px-8 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${selectedInterval === 'year' ? 'bg-naija-green text-white shadow-lg shadow-naija-green/20' : 'text-gray-400 hover:text-white'}`}
                            onClick={() => setSelectedInterval('year')}
                        >
                            Yearly
                            <span className="bg-naija-gold text-black text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">Save 17%</span>
                        </button>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                        {SUBSCRIPTION_PLANS.map((plan) => {
                            const price = selectedInterval === 'month' ? plan.monthlyPrice : plan.yearlyPrice;

                            return (
                                <div
                                    key={plan.id}
                                    className={`relative group transition-all duration-500 ${plan.popular ? 'md:-mt-4 md:-mb-4 z-10' : 'z-0'}`}
                                >
                                    {plan.popular && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                                            <div className="bg-gradient-to-r from-naija-green to-emerald-500 text-white font-bold text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-naija-green/30 flex items-center gap-1.5">
                                                <Star className="h-3 w-3 fill-white" />
                                                Most Popular
                                            </div>
                                        </div>
                                    )}

                                    <div className={`h-full bg-gradient-to-b from-white/[0.08] to-transparent backdrop-blur-xl border rounded-[2.5rem] p-8 transition-all duration-500 overflow-hidden ${plan.popular ? 'border-naija-green/50 ring-1 ring-naija-green/20 shadow-2xl shadow-naija-green/10' : 'border-white/10 hover:border-white/20'}`}>
                                        {/* Glow Effect */}
                                        <div className={`absolute top-0 right-0 w-32 h-32 blur-[80px] -z-10 transition-opacity duration-500 ${plan.popular ? 'bg-naija-green/20 opacity-100' : 'bg-white/5 opacity-0 group-hover:opacity-100'}`} />

                                        <div className="mb-8">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-white uppercase tracking-wider">{plan.name}</h3>
                                                {plan.id === 'enterprise' && <Crown className="h-5 w-5 text-naija-gold animate-bounce-subtle" />}
                                            </div>
                                            <div className="flex items-baseline gap-1 mt-6">
                                                <span className="text-5xl font-black text-white">${price}</span>
                                                <span className="text-gray-400 font-medium">/{selectedInterval}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-10 min-h-[200px]">
                                            <p className="text-sm text-gray-400 font-medium uppercase tracking-widest">What's included:</p>
                                            <ul className="space-y-4">
                                                {plan.features.map((feature, i) => (
                                                    <li key={i} className="flex items-start gap-3 group/item">
                                                        <div className="mt-1 bg-naija-green/20 rounded-full p-0.5 transition-colors group-hover/item:bg-naija-green/40">
                                                            <Check className="h-3 w-3 text-naija-green" />
                                                        </div>
                                                        <span className="text-sm text-gray-300 group-hover/item:text-white transition-colors leading-snug">{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <Link to="/auth" className="block w-full">
                                            <button
                                                className={`group/btn relative w-full h-14 rounded-2xl font-bold text-lg transition-all duration-300 overflow-hidden flex items-center justify-center gap-2 ${plan.popular ? 'bg-naija-green text-white hover:scale-[1.02] active:scale-95 shadow-lg shadow-naija-green/25' : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'}`}
                                            >
                                                <span>Get Started</span>
                                                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover/btn:translate-x-1" />
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>

            <LandingFooter />
        </div>
    );
};

export default PricingPage;
