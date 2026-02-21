
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Triangle } from "lucide-react";

export const PlotHoleDetector = () => {
  const [plotSummary, setPlotSummary] = React.useState("");
  const [issues, setIssues] = React.useState<string[]>([]);

  const detectPlotHoles = () => {
    // Simulated plot hole detection
    const simulatedIssues = [
      "Character motivation unclear in Act 2",
      "Timeline inconsistency between scenes 3 and 4",
      "Unresolved subplot with supporting character",
    ];
    setIssues(simulatedIssues);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plot Hole Detector</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Enter your plot summary here..."
          value={plotSummary}
          onChange={(e) => setPlotSummary(e.target.value)}
          className="min-h-[150px]"
        />
        <Button onClick={detectPlotHoles} className="w-full">
          <Triangle className="mr-2 h-4 w-4" />
          Analyze Plot
        </Button>
        {issues.length > 0 && (
          <div className="space-y-2">
            {issues.map((issue, index) => (
              <Alert key={index}>
                <AlertDescription>{issue}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
