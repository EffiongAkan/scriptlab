
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
    <div className="fixed bottom-2 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 p-2 sm:p-3 px-4 sm:px-6 bg-gray-900/90 backdrop-blur-md rounded-full text-gray-300 text-[10px] sm:text-sm flex items-center justify-between border border-white/10 shadow-2xl w-[calc(100%-1rem)] max-w-[320px] sm:max-w-none sm:min-w-[600px] transition-all duration-300">
      <div className="flex items-center space-x-6">
        <div className="flex items-center">
          <FileText className="w-4 h-4 mr-2 text-naija-gold/80" />
          <span className="flex items-center gap-1">
            <span className="font-bold text-white tracking-wide">{statistics.words}</span> words
            <span className="text-gray-600 mx-1">|</span>
            <span className="font-bold text-white tracking-wide">{statistics.characters}</span> chars
          </span>
        </div>

        <div className="hidden lg:flex items-center">
          <span className="text-gray-600 mr-4">|</span>
          <span className="flex items-center gap-1">
            <span className="font-bold text-white tracking-wide">{statistics.scenes}</span> scenes
            <span className="text-gray-600 mx-1">|</span>
            <span className="font-bold text-white tracking-wide">{statistics.dialogueCount}</span> dialogue
          </span>
        </div>
      </div>

      <div className="flex items-center ml-6">
        <Clock className="w-4 h-4 mr-2 text-naija-gold/80" />
        <span className="flex items-center gap-1">
          Est. runtime: <span className="font-bold text-white tracking-wide">{statistics.estimatedRuntime}</span> min
        </span>
      </div>
    </div>
  );
};
