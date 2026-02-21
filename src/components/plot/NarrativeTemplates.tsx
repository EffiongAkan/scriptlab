
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const templates = {
  "Three Act": [
    "Act 1: Setup - Introduce the main character and their world",
    "Act 2: Confrontation - Present challenges and obstacles",
    "Act 3: Resolution - Resolve the main conflict",
  ],
  "Hero's Journey": [
    "Ordinary World",
    "Call to Adventure",
    "Meeting the Mentor",
    "Crossing the Threshold",
    "Tests, Allies, Enemies",
    "Approach to Inmost Cave",
    "Ordeal",
    "Reward",
    "The Road Back",
    "Resurrection",
    "Return with Elixir",
  ],
  "Nigerian Epic": [
    "Ancestral Call",
    "Spirit Guide's Blessing",
    "Village Challenge",
    "Journey Beyond",
    "Sacred Trial",
    "Return to Community",
  ],
};

export const NarrativeTemplates = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Narrative Structure Templates</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="Three Act">
          <TabsList className="w-full">
            {Object.keys(templates).map((template) => (
              <TabsTrigger key={template} value={template} className="flex-1">
                {template}
              </TabsTrigger>
            ))}
          </TabsList>
          {Object.entries(templates).map(([name, steps]) => (
            <TabsContent key={name} value={name}>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {steps.map((step, index) => (
                    <div key={index} className="p-3 bg-muted rounded-lg">
                      {index + 1}. {step}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};
