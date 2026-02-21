export interface AdminSubscriptionPlan {
    id: string;
    name: string;
    description: string;
    price: number;
    yearlyPrice?: number;
    interval: 'month' | 'year';
    features: string[];
    limits: {
        scripts: number;
        aiGenerations: number;
        collaborators: number;
        exports: number;
    };
    isActive: boolean;
    subscriberCount: number;
}
