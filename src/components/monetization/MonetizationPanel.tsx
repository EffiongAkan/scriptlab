import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AICreditsManager } from './AICreditsManager';
import { TemplatesMarketplace } from './TemplatesMarketplace';
import { ProducerPlatform } from './ProducerPlatform';
import { Zap, ShoppingBag, Send } from 'lucide-react';
import { AICreditsStatus } from "@/components/AICreditsStatus";

export const MonetizationPanel: React.FC = () => {
  return (
    <div className="w-full max-w-full space-y-6">
      {/* AI Credits always visible in premium panel */}
      <div className="flex justify-end mb-2">
        <AICreditsStatus />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Monetization & Premium Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Purchase AI credits, browse professional templates, 
            and submit your scripts to top producers in the industry.
          </p>
          
          <Tabs defaultValue="credits" className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto gap-2 bg-transparent p-0">
              <TabsTrigger value="credits" className="flex items-center gap-2 justify-center p-3">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">AI Credits</span>
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-2 justify-center p-3">
                <ShoppingBag className="h-4 w-4" />
                <span className="hidden sm:inline">Templates</span>
              </TabsTrigger>
              <TabsTrigger value="producers" className="flex items-center gap-2 justify-center p-3">
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Producers</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="credits" className="mt-6">
              <AICreditsManager />
            </TabsContent>

            <TabsContent value="templates" className="mt-6">
              <TemplatesMarketplace />
            </TabsContent>

            <TabsContent value="producers" className="mt-6">
              <ProducerPlatform />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
