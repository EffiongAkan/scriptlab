export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface SubscriptionPlan {
    id: SubscriptionTier;
    name: string;
    description: string;
    monthlyPrice: number;
    yearlyPrice: number;
    features: string[];
    limits: {
        scripts: number;
        aiCreditsPerMonth: number;
        aiCreditsYearly?: number;
        collaborators: number;
        exports: number;
    };
    popular?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
        id: 'free',
        name: 'Free',
        description: 'Perfect for beginners and hobbyists',
        monthlyPrice: 0,
        yearlyPrice: 0,
        features: [
            'Up to 3 scripts',
            '25 AI credits (starter)',
            'Basic export formats',
            'Community support',
        ],
        limits: {
            scripts: 3,
            aiCreditsPerMonth: 25,
            collaborators: 0,
            exports: 5
        },
    },
    {
        id: 'pro',
        name: 'Professional',
        description: 'For serious scriptwriters and creators',
        monthlyPrice: 15,
        yearlyPrice: 150,
        features: [
            '700 AI credits / month (9,500 / year)',
            'Unlimited scripts',
            'Script generation',
            'Analyze video (create scripts from video)',
            'Real-time collaboration',
            'Script Analysis',
            'Modify script with AI',
            'Advanced Export options',
            'Version control',
            'Priority support',
        ],
        limits: {
            scripts: -1,
            aiCreditsPerMonth: 700,
            aiCreditsYearly: 9500,
            collaborators: 5,
            exports: -1
        },
        popular: true,
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'Custom solutions for teams and studios',
        monthlyPrice: 55,
        yearlyPrice: 550,
        features: [
            'Everything in Professional',
            'Unlimited AI credits',
            'Unlimited collaborators',
            'Custom templates',
            'Dedicated support',
        ],
        limits: {
            scripts: -1,
            aiCreditsPerMonth: -1,
            collaborators: -1,
            exports: -1
        },
    },
];
