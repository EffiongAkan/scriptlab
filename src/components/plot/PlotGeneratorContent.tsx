
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { NarrativeTemplates } from "@/components/plot/NarrativeTemplates";
import { ConflictGenerator } from "@/components/plot/ConflictGenerator";

interface PlotGeneratorContentProps {
  isGenerating: boolean;
  generatedContent: string | null;
  activeTab: string;
  handleRegenerate: () => void;
  handleSaveToProject: () => void;
  handleCharacterSaveClick: () => void;
}

export function PlotGeneratorContent({
  isGenerating,
  generatedContent,
  activeTab,
  handleRegenerate,
  handleSaveToProject,
  handleCharacterSaveClick,
}: PlotGeneratorContentProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Generated Content</CardTitle>
            <CardDescription>
              {activeTab === "plot" && "AI-generated plot outline based on your specifications"}
              {activeTab === "character" && "AI-generated character profiles for your story"}
              {activeTab === "dialogue" && "AI-generated dialogue samples in your selected languages"}
            </CardDescription>
          </div>
          {/* Show Save button for plot and character respectively */}
          {generatedContent && !isGenerating && (
            activeTab === "plot" ? (
              <Button variant="outline" onClick={handleSaveToProject} className="flex items-center gap-1">
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            ) : activeTab === "character" ? (
              <Button variant="outline" onClick={handleCharacterSaveClick} className="flex items-center gap-1">
                <Save className="h-4 w-4 mr-1" />
                Save Character
              </Button>
            ) : null
          )}
        </CardHeader>
        <CardContent>
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-naija-green/10 rounded-full flex items-center justify-center mb-4">
                <Loader2 className="w-8 h-8 text-naija-green animate-spin" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Generating content...</h3>
              <p className="text-sm text-gray-500 max-w-md mt-1">
                Our AI is crafting your story elements. This may take a moment.
              </p>
            </div>
          ) : generatedContent ? (
            <div className="prose prose-slate max-w-none">
              {generatedContent.split("\n").map((line, index) => {
                if (line.startsWith("# ")) {
                  return <h1 key={index} className="text-2xl font-bold mt-6 mb-2">{line.substring(2)}</h1>;
                } else if (line.startsWith("## ")) {
                  return <h2 key={index} className="text-xl font-bold mt-4 mb-2">{line.substring(3)}</h2>;
                } else if (line.startsWith("### ")) {
                  return <h3 key={index} className="text-lg font-bold mt-3 mb-1">{line.substring(4)}</h3>;
                } else if (line.startsWith("- ")) {
                  return <li key={index} className="ml-6">{line.substring(2)}</li>;
                } else if (line.startsWith("**") && line.endsWith("**")) {
                  const content = line.replace(/\*\*/g, "");
                  return <p key={index} className="font-bold">{content}</p>;
                } else if (line.trim() === "") {
                  return <br key={index} />;
                } else {
                  return <p key={index}>{line}</p>;
                }
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-naija-green/10 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-naija-green"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Ready to generate content</h3>
              <p className="text-sm text-gray-500 max-w-md mt-1">
                Configure your generation settings and click the "Generate Content" button to create AI-powered story elements.
              </p>
            </div>
          )}
        </CardContent>
        {generatedContent && !isGenerating && (
          <CardFooter className="border-t justify-end">
            <Button variant="outline" onClick={handleRegenerate}>Regenerate</Button>
          </CardFooter>
        )}
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <NarrativeTemplates />
        <ConflictGenerator />
      </div>
    </div>
  );
}
