
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const CharacterAnalysisPanel: React.FC = () => (
  <Card>
    <CardHeader>
      <CardTitle>Character Analysis</CardTitle>
      <p className="text-muted-foreground text-sm">
        Detailed character metrics and insights
      </p>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium mb-4">Character Development Scores</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Amaka</span>
                <span className="text-sm text-muted-foreground">90%</span>
              </div>
              <Progress value={90} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Chidi</span>
                <span className="text-sm text-muted-foreground">85%</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Halima</span>
                <span className="text-sm text-muted-foreground">70%</span>
              </div>
              <Progress value={70} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Tunde</span>
                <span className="text-sm text-muted-foreground">65%</span>
              </div>
              <Progress value={65} className="h-2" />
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-medium mb-4">Character Interaction Heat Map</h3>
          <div className="bg-gray-100 dark:bg-zinc-800 rounded-md p-6 h-48 flex items-center justify-center text-gray-500 dark:text-gray-400">
            Character relationship visualization will appear here
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default CharacterAnalysisPanel;
