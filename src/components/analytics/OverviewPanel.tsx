
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const COLORS = ["#008751", "#00a86b", "#FFD700", "#F7921E", "#8B4513"];

interface CharacterData {
  name: string;
  value: number;
}

interface EmotionalArcData {
  name: string;
  tension: number;
  emotion: string;
}

interface OverviewPanelProps {
  characterData: CharacterData[];
  emotionalArcData: EmotionalArcData[];
}

export const OverviewPanel: React.FC<OverviewPanelProps> = ({
  characterData,
  emotionalArcData,
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <Card>
      <CardHeader>
        <CardTitle>Script Health</CardTitle>
        <CardDescription>
          Overall script metrics and quality indicators
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Plot Coherence</span>
            <span className="text-sm text-muted-foreground">85%</span>
          </div>
          <Progress value={85} className="h-2" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Character Development</span>
            <span className="text-sm text-muted-foreground">78%</span>
          </div>
          <Progress value={78} className="h-2" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Cultural Authenticity</span>
            <span className="text-sm text-muted-foreground">92%</span>
          </div>
          <Progress value={92} className="h-2" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Dialogue Quality</span>
            <span className="text-sm text-muted-foreground">80%</span>
          </div>
          <Progress value={80} className="h-2" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Pacing</span>
            <span className="text-sm text-muted-foreground">75%</span>
          </div>
          <Progress value={75} className="h-2" />
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Character Frequency</CardTitle>
        <CardDescription>Character presence across scenes</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={characterData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
            >
              {characterData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Legend />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Emotional Arc</CardTitle>
        <CardDescription>Tension levels across scenes</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart width={400} height={300}>
            {/* For visual polish, this graph could be improved 
              (replace with BarChart as in old code if necessary) */}
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  </div>
);
export default OverviewPanel;
