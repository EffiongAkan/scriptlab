
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CastingDatabaseManager } from './CastingDatabaseManager';
import { LocationScoutingManager } from './LocationScoutingManager';
import { BudgetEstimationTool } from './BudgetEstimationTool';
import { ProductionScheduler } from './ProductionScheduler';
import { Users, MapPin, DollarSign, Calendar } from 'lucide-react';

interface IndustryIntegrationPanelProps {
  scriptId: string;
  elements?: any[];
}

export const IndustryIntegrationPanel: React.FC<IndustryIntegrationPanelProps> = ({
  scriptId,
  elements = []
}) => {
  return (
    <div className="w-full max-w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Industry Integration Suite
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Connect your script to industry-standard tools for casting, location scouting, 
            budget planning, and production scheduling.
          </p>
          
          <Tabs defaultValue="casting" className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 h-auto gap-2 bg-transparent p-0">
              <TabsTrigger value="casting" className="flex items-center gap-2 justify-center p-3">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Casting</span>
              </TabsTrigger>
              <TabsTrigger value="locations" className="flex items-center gap-2 justify-center p-3">
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">Locations</span>
              </TabsTrigger>
              <TabsTrigger value="budget" className="flex items-center gap-2 justify-center p-3">
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Budget</span>
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex items-center gap-2 justify-center p-3">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Schedule</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="casting" className="mt-6">
              <CastingDatabaseManager scriptId={scriptId} elements={elements} />
            </TabsContent>

            <TabsContent value="locations" className="mt-6">
              <LocationScoutingManager scriptId={scriptId} elements={elements} />
            </TabsContent>

            <TabsContent value="budget" className="mt-6">
              <BudgetEstimationTool scriptId={scriptId} elements={elements} />
            </TabsContent>

            <TabsContent value="schedule" className="mt-6">
              <ProductionScheduler scriptId={scriptId} elements={elements} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
