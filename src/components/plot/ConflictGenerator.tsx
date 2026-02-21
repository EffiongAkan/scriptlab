
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const conflictTypes = [
  { type: "Person vs. Person", examples: ["Rivalry", "Betrayal", "Competition"] },
  { type: "Person vs. Nature", examples: ["Survival", "Natural disaster", "Wildlife"] },
  { type: "Person vs. Society", examples: ["Rebellion", "Social norms", "Injustice"] },
  { type: "Person vs. Self", examples: ["Internal struggle", "Moral dilemma", "Identity"] },
  { type: "Person vs. Technology", examples: ["AI conflict", "Digital danger", "Innovation"] },
  { type: "Person vs. Supernatural", examples: ["Spiritual battle", "Magic", "Destiny"] },
];

export const ConflictGenerator = () => {
  const [selectedConflict, setSelectedConflict] = React.useState<typeof conflictTypes[0] | null>(null);

  const generateConflict = () => {
    const randomType = conflictTypes[Math.floor(Math.random() * conflictTypes.length)];
    setSelectedConflict(randomType);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conflict Generator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={generateConflict} className="w-full">
          Generate Conflict
        </Button>
        {selectedConflict && (
          <div className="space-y-2">
            <h3 className="font-bold text-lg">{selectedConflict.type}</h3>
            <div className="flex flex-wrap gap-2">
              {selectedConflict.examples.map((example, index) => (
                <Badge key={index} variant="secondary">
                  {example}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
