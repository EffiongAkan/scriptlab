
import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GenreSelector, SubGenreSelector } from "@/components/plot/GenreSelector";
import { LanguageSelector } from "@/components/plot/LanguageSelector";
import { StoryBeatMap } from "@/components/plot/StoryBeatMap";
import { PlotHoleDetector } from "@/components/plot/PlotHoleDetector";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  generationPrompt: any;
  setGenerationPrompt: (x: any) => void;
  culturalAuthenticityLevel: number[];
  setCulturalAuthenticityLevel: (v: number[]) => void;
  includeTraditional: boolean;
  setIncludeTraditional: (b: boolean) => void;
  isGenerating: boolean;
  handleGenerate: () => void;
}

export function PlotGeneratorSidebar({
  activeTab,
  setActiveTab,
  generationPrompt,
  setGenerationPrompt,
  culturalAuthenticityLevel,
  setCulturalAuthenticityLevel,
  includeTraditional,
  setIncludeTraditional,
  isGenerating,
  handleGenerate,
}: SidebarProps) {
  return (
    <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Generation Controls</CardTitle>
        <CardDescription>Configure your AI generation settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Content Type</Label>
          <Tabs defaultValue="plot" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="plot">Plot</TabsTrigger>
              <TabsTrigger value="character">Character</TabsTrigger>
              <TabsTrigger value="dialogue">Dialogue</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="space-y-2">
          <Label>Genre</Label>
          <GenreSelector value={generationPrompt.genre} onValueChange={value => setGenerationPrompt({
            ...generationPrompt,
            genre: value
          })} />
        </div>
        <div className="space-y-2">
          <Label>Subgenres (Optional)</Label>
          <SubGenreSelector values={generationPrompt.subGenres || []} onValuesChange={values => setGenerationPrompt({
            ...generationPrompt,
            subGenres: values
          })} />
        </div>
        <div className="space-y-2">
          <Label>Language</Label>
          <LanguageSelector value={generationPrompt.language} onValueChange={value => setGenerationPrompt({
            ...generationPrompt,
            language: value
          })} />
        </div>
        <div className="space-y-2">
          <Label>Cultural Setting</Label>
          <Input 
            placeholder="e.g., Lagos, Igbo village, Northern Nigeria..." 
            value={generationPrompt.setting?.region || ""} 
            onChange={e => setGenerationPrompt({
              ...generationPrompt,
              setting: {
                ...generationPrompt.setting,
                region: e.target.value
              }
            })} 
          />
        </div>
        <div className="space-y-2">
          <Label>Plot Seed (Optional)</Label>
          <Textarea 
            placeholder="Brief description of your story idea..." 
            value={generationPrompt.seedPlot || ""} 
            onChange={e => setGenerationPrompt({
              ...generationPrompt,
              seedPlot: e.target.value
            })} 
            className="min-h-[100px]" 
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Cultural Authenticity</Label>
            <span className="text-sm text-gray-500">{culturalAuthenticityLevel[0]}%</span>
          </div>
          <Slider 
            value={culturalAuthenticityLevel} 
            onValueChange={setCulturalAuthenticityLevel} 
            max={100} 
            step={10} 
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch 
            id="traditional" 
            checked={includeTraditional}
            onCheckedChange={setIncludeTraditional}
          />
          <Label htmlFor="traditional">Include traditional storytelling elements</Label>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full bg-naija-green hover:bg-naija-green-dark text-white" onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? (
            <>Generating...</>
          ) : "Generate Content"}
        </Button>
      </CardFooter>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle>Plot Tools</CardTitle>
        <CardDescription>Additional tools to enhance your plot</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Tabs defaultValue="beat-map" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="beat-map">Story Beats</TabsTrigger>
            <TabsTrigger value="plot-holes">Plot Holes</TabsTrigger>
          </TabsList>
          <TabsContent value="beat-map">
            <StoryBeatMap />
          </TabsContent>
          <TabsContent value="plot-holes">
            <PlotHoleDetector />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
    </div>
  );
}
