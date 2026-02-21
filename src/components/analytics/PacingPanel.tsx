import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface EmotionalArcData {
  name: string;
  tension: number;
  emotion: string;
}

interface PacingPanelProps {
  emotionalArcData: EmotionalArcData[];
}

export const PacingPanel: React.FC<PacingPanelProps> = ({ emotionalArcData }) => (
  <Card>
    <CardHeader>
      <CardTitle>Pacing Analysis</CardTitle>
      <p className="text-muted-foreground">Scene-by-scene pacing and emotional intensity</p>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={emotionalArcData} margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}>
          <XAxis dataKey="name" />
          <YAxis domain={[0, 10]} label={{ value: 'Intensity', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="tension" fill="#008751" name="Emotional Intensity" />
        </BarChart>
      </ResponsiveContainer>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium mb-4">Pacing Recommendations</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-naija-green mt-0.5"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
              <span>Good build-up of tension through the middle scenes</span>
            </li>
            <li className="flex items-start space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 mt-0.5"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="M12 8v4"></path><path d="M12 16h.01"></path></svg>
              <span>Consider adding more tension to Scene 2 to maintain engagement</span>
            </li>
            <li className="flex items-start space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 mt-0.5"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="M12 8v4"></path><path d="M12 16h.01"></path></svg>
              <span>The resolution may be too abrupt - consider extending Scene 8</span>
            </li>
            <li className="flex items-start space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-naija-green mt-0.5"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
              <span>Strong climax in Scene 6</span>
            </li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-medium mb-4">Emotional Balance</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Suspense</span>
              <span className="text-sm text-muted-foreground">35%</span>
            </div>
            <Progress value={35} className="h-2" />
          </div>
          <div className="space-y-2 mt-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Drama</span>
              <span className="text-sm text-muted-foreground">30%</span>
            </div>
            <Progress value={30} className="h-2" />
          </div>
          <div className="space-y-2 mt-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Action</span>
              <span className="text-sm text-muted-foreground">20%</span>
            </div>
            <Progress value={20} className="h-2" />
          </div>
          <div className="space-y-2 mt-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Humor</span>
              <span className="text-sm text-muted-foreground">10%</span>
            </div>
            <Progress value={10} className="h-2" />
          </div>
          <div className="space-y-2 mt-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Romance</span>
              <span className="text-sm text-muted-foreground">5%</span>
            </div>
            <Progress value={5} className="h-2" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default PacingPanel;
