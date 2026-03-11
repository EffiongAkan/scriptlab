import React, { useState, useEffect } from "react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Star, Check } from 'lucide-react';
import { Link } from "react-router-dom";
import { SUBSCRIPTION_PLANS } from '@/constants/subscriptionPlans';

const PricingPage = () => {
    const [selectedInterval, setSelectedInterval] = useState<'month' | 'year'>('month');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-[#0a0a0a] selection:bg-naija-green/30">
            <LandingHeader />

            <main className="flex-1 pt-32 pb-24" role="main">
                <div className="max-w-4xl mx-auto px-6 mb-16 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">Simple, Transparent Pricing</h1>
                    <p className="text-xl text-gray-400">Choose the perfect plan for your screenwriting journey. All plans are billed in USD.</p>
                </div>

                {/* Interval Toggle */}
                <div className="flex justify-center mb-12">
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-1 gap-1">
                        <Button
                            variant={selectedInterval === 'month' ? 'default' : 'ghost'}
                            size="sm"
                            className={selectedInterval === 'month' ? 'bg-naija-green text-white hover:bg-naija-green/90' : 'text-gray-400 hover:text-white'}
                            onClick={() => setSelectedInterval('month')}
                        >
                            Monthly
                        </Button>
                        <Button
                            variant={selectedInterval === 'year' ? 'default' : 'ghost'}
                            size="sm"
                            className={selectedInterval === 'year' ? 'bg-naija-green text-white hover:bg-naija-green/90' : 'text-gray-400 hover:text-white'}
                            onClick={() => setSelectedInterval('year')}
                        >
                            Yearly
                            <Badge variant="secondary" className="ml-2 bg-naija-gold text-black hover:bg-naija-gold/90 text-xs border-none">Save 17%</Badge>
                        </Button>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {SUBSCRIPTION_PLANS.map((plan) => {
                            const price = selectedInterval === 'month' ? plan.monthlyPrice : plan.yearlyPrice;

                            return (
                                <Card
                                    key={plan.id}
                                    className={`relative transition-all bg-black/40 border-white/10 ${plan.popular ? 'border-naija-green shadow-[0_0_30px_rgba(16,185,129,0.15)] shadow-naija-green/20 scale-105 z-10' : 'hover:border-white/20'}`}
                                >
                                    {plan.popular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                            <Badge className="bg-naija-green text-white border-none px-3 py-1">
                                                <Star className="h-3 w-3 mr-1 fill-white" />
                                                Most Popular
                                            </Badge>
                                        </div>
                                    )}

                                    <CardHeader className="text-center pt-8">
                                        <CardTitle className="flex items-center justify-center gap-2 text-white">
                                            {plan.id === 'enterprise' && <Crown className="h-5 w-5 text-naija-gold" />}
                                            {plan.name}
                                        </CardTitle>
                                        <div className="text-4xl font-bold text-white mt-4">
                                            ${price}
                                            <span className="text-sm font-normal text-gray-400">/{selectedInterval}</span>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-6 pb-8">
                                        <ul className="space-y-3">
                                            {plan.features.map((feature, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <Check className="h-5 w-5 text-naija-green mt-0.5 flex-shrink-0" />
                                                    <span className="text-sm text-gray-300">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        <Link to="/auth" className="block w-full pt-4">
                                            <Button
                                                className={`w-full h-12 text-md font-bold ${plan.popular ? 'bg-naija-green hover:bg-naija-green/90 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                                            >
                                                Get Started
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
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
