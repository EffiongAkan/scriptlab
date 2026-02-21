import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import OverviewPanel from "@/components/analytics/OverviewPanel";
import CharacterAnalysisPanel from "@/components/analytics/CharacterAnalysisPanel";
import PacingPanel from "@/components/analytics/PacingPanel";
import LanguagePanel from "@/components/analytics/LanguagePanel";
import IntelligencePanel from "@/components/analytics/IntelligencePanel";

export default function Analytics() {
  // Sample data for character frequency
  const characterData = [{
    name: "Amaka",
    value: 24
  }, {
    name: "Chidi",
    value: 18
  }, {
    name: "Halima",
    value: 12
  }, {
    name: "Tunde",
    value: 9
  }, {
    name: "Other",
    value: 14
  }];

  // Sample data for language distribution
  const languageData = [{
    name: "English",
    value: 65
  }, {
    name: "Pidgin",
    value: 20
  }, {
    name: "Yoruba",
    value: 8
  }, {
    name: "Igbo",
    value: 5
  }, {
    name: "Hausa",
    value: 2
  }];

  // Sample data for emotional arcs
  const emotionalArcData = [{
    name: "Scene 1",
    tension: 3,
    emotion: "curiosity"
  }, {
    name: "Scene 2",
    tension: 4,
    emotion: "anticipation"
  }, {
    name: "Scene 3",
    tension: 6,
    emotion: "suspense"
  }, {
    name: "Scene 4",
    tension: 8,
    emotion: "fear"
  }, {
    name: "Scene 5",
    tension: 7,
    emotion: "anger"
  }, {
    name: "Scene 6",
    tension: 9,
    emotion: "climax"
  }, {
    name: "Scene 7",
    tension: 5,
    emotion: "relief"
  }, {
    name: "Scene 8",
    tension: 2,
    emotion: "resolution"
  }];

  // Demo data for Intelligence tab
  const predictedPerformance = {
    reads: 2400,
    awardsPotential: "Medium",
    engagementIndex: 88,
    predictionExplanation:
      "High engagement index suggests a strong emotional arc, though awards potential could increase with deeper character development.",
  };

  const trendGenres = [
    { name: "Drama", value: 34 },
    { name: "Comedy", value: 28 },
    { name: "Thriller", value: 22 },
    { name: "Action", value: 16 },
  ];

  const trendLanguages = [
    { name: "English", value: 67 },
    { name: "Pidgin", value: 15 },
    { name: "Yoruba", value: 10 },
    { name: "Igbo", value: 5 },
    { name: "Hausa", value: 3 },
  ];

  const audiencePoll = [
    { segment: "18-24", favorability: 80 },
    { segment: "25-34", favorability: 70 },
    { segment: "35-44", favorability: 65 },
    { segment: "45+", favorability: 55 },
  ];

  const successProbability = 0.76; // 76%
  const COLORS = ["#008751", "#00a86b", "#FFD700", "#F7921E", "#8B4513"];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold tracking-tight text-6xl text-slate-300">Analytics</h1>
        <p className="text-muted-foreground">Insights and analysis of your script</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="characters">Characters</TabsTrigger>
          <TabsTrigger value="pacing">Pacing & Emotion</TabsTrigger>
          <TabsTrigger value="language">Language</TabsTrigger>
          <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewPanel
            characterData={characterData}
            emotionalArcData={emotionalArcData}
          />
        </TabsContent>
        <TabsContent value="characters" className="mt-6">
          <CharacterAnalysisPanel />
        </TabsContent>
        <TabsContent value="pacing" className="mt-6">
          <PacingPanel emotionalArcData={emotionalArcData} />
        </TabsContent>
        <TabsContent value="language" className="mt-6">
          <LanguagePanel languageData={languageData} />
        </TabsContent>
        <TabsContent value="intelligence" className="mt-6">
          <IntelligencePanel
            predictedPerformance={predictedPerformance}
            trendGenres={trendGenres}
            trendLanguages={trendLanguages}
            audiencePoll={audiencePoll}
            successProbability={successProbability}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
