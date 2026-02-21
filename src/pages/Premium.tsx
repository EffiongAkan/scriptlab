import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crown, Zap } from "lucide-react";
import { SubscriptionManager } from "@/components/monetization/SubscriptionManager";
import { AICreditsManager } from "@/components/monetization/AICreditsManager";
import { useSearchParams } from "react-router-dom";
import { useAICredits } from "@/hooks/useAICredits";
import { useSubscription } from "@/hooks/useSubscription";
import { Badge } from "@/components/ui/badge";

export default function Premium() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") === "credits" ? "credits" : "subscription";
  const { data: credits } = useAICredits();
  const { subscription } = useSubscription();

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Crown className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold">Premium</h1>
          </div>
          <p className="text-muted-foreground">Manage your subscription and AI credits</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5 text-sm">
            <Crown className="h-4 w-4 text-primary" />
            <span className="capitalize font-semibold">{subscription.tier}</span>
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5 text-sm">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="font-semibold">{credits ?? 0} Credits</span>
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="subscription" className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            Subscription
          </TabsTrigger>
          <TabsTrigger value="credits" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            AI Credits
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subscription" className="mt-6">
          <SubscriptionManager />
        </TabsContent>

        <TabsContent value="credits" className="mt-6">
          <AICreditsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
