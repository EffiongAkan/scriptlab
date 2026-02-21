
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StoryBeat {
  title: string;
  description: string;
  percentage: number;
}

const defaultBeats: StoryBeat[] = [
  { title: "Opening Image", description: "Set the tone and mood of the story", percentage: 0 },
  { title: "Setup", description: "Introduce the main character and their world", percentage: 12 },
  { title: "Catalyst", description: "The inciting incident that starts the journey", percentage: 25 },
  { title: "Debate", description: "Hero's reaction to the catalyst", percentage: 37 },
  { title: "Break into Two", description: "Hero makes a choice and enters a new world", percentage: 50 },
  { title: "B Story", description: "Secondary plot line begins", percentage: 62 },
  { title: "Midpoint", description: "Raises the stakes", percentage: 75 },
  { title: "Resolution", description: "Story reaches its conclusion", percentage: 100 },
];

export const StoryBeatMap = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Story Beat Map</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {defaultBeats.map((beat, index) => (
              <div key={index} className="relative">
                <div className="flex justify-between items-center mb-2">
                  <Label className="font-bold">{beat.title}</Label>
                  <span className="text-sm text-muted-foreground">{beat.percentage}%</span>
                </div>
                <Alert>
                  <AlertDescription>{beat.description}</AlertDescription>
                </Alert>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
