
import React, { useMemo } from "react";
import { ScriptElementType } from "@/hooks/useScriptContent";
import { FileText, Clock } from "lucide-react";

interface ScriptStatisticsFooterProps {
  scriptElements: ScriptElementType[];
}

export const ScriptStatisticsFooter = ({ scriptElements }: ScriptStatisticsFooterProps) => {
  const statistics = useMemo(() => {
    // No elements, return empty stats
    if (!scriptElements || scriptElements.length === 0) {
      return {
        characters: 0,
        words: 0,
        scenes: 0,
        dialogueCount: 0,
        estimatedRuntime: 0,
      };
    }

    // Count total characters
    const characters = scriptElements.reduce((total, element) => {
      return total + (element.content?.length || 0);
    }, 0);

    // Count total words
    const words = scriptElements.reduce((total, element) => {
      const content = element.content || "";
      // Count words by splitting on whitespace
      const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
      return total + wordCount;
    }, 0);

    // Count scenes (heading elements)
    const scenes = scriptElements.filter(element => element.type === 'heading').length;

    // Count dialogue elements
    const dialogueCount = scriptElements.filter(element => element.type === 'dialogue').length;

    // Estimate runtime (1 page = ~1 minute of screen time, and ~250 words per page)
    const estimatedPages = words / 250;
    const estimatedRuntime = Math.max(1, Math.round(estimatedPages));

    return { characters, words, scenes, dialogueCount, estimatedRuntime };
  }, [scriptElements]);

  return (
    <div className="mt-4 p-3 bg-gray-800 rounded-md text-gray-300 text-sm flex flex-wrap items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <FileText className="w-4 h-4 mr-2 text-gray-400" />
          <span>
            <span className="font-medium">{statistics.words}</span> words 
            <span className="text-gray-500 mx-1">|</span>
            <span className="font-medium">{statistics.characters}</span> characters
          </span>
        </div>
        
        <div className="hidden md:flex items-center">
          <span className="text-gray-500 mx-2">|</span>
          <span>
            <span className="font-medium">{statistics.scenes}</span> scenes
            <span className="text-gray-500 mx-1">|</span>
            <span className="font-medium">{statistics.dialogueCount}</span> dialogue blocks
          </span>
        </div>
      </div>
      
      <div className="flex items-center">
        <Clock className="w-4 h-4 mr-2 text-gray-400" />
        <span>Est. runtime: <span className="font-medium">{statistics.estimatedRuntime}</span> min</span>
      </div>
    </div>
  );
};
