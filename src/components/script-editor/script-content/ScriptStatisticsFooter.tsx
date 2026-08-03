
import React, { useMemo } from "react";
import { ScriptElementType } from "@/hooks/useScriptContent";
import { Clock } from "lucide-react";

interface ScriptStatisticsFooterProps {
  scriptElements: ScriptElementType[];
}

export const ScriptStatisticsFooter = ({ scriptElements }: ScriptStatisticsFooterProps) => {
  const statistics = useMemo(() => {
    if (!scriptElements || scriptElements.length === 0) {
      return {
        characters: 0,
        words: 0,
        scenes: 0,
        dialogueCount: 0,
        estimatedRuntime: 0,
      };
    }

    const characters = scriptElements.reduce((total, element) => {
      return total + (element.content?.length || 0);
    }, 0);

    const words = scriptElements.reduce((total, element) => {
      const content = element.content || "";
      const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
      return total + wordCount;
    }, 0);

    const scenes = scriptElements.filter(element => element.type === 'heading').length;
    const dialogueCount = scriptElements.filter(element => element.type === 'dialogue').length;

    const estimatedPages = words / 250;
    const estimatedRuntime = Math.max(1, Math.round(estimatedPages));

    return { characters, words, scenes, dialogueCount, estimatedRuntime };
  }, [scriptElements]);

  const statItems = [
    { value: statistics.words.toLocaleString(), label: "WORDS" },
    { value: statistics.characters.toLocaleString(), label: "CHARS" },
    { value: statistics.scenes, label: "SCENES" },
    { value: statistics.dialogueCount, label: "DIALOGUE" },
  ];

  return (
    <div className="md:fixed md:bottom-5 md:left-1/2 md:-translate-x-1/2 z-30 bg-[#1A1A1A]/95 md:bg-gray-900/90 backdrop-blur-md rounded-none md:rounded-xl text-gray-300 flex items-stretch border-0 md:border md:border-white/10 shadow-none md:shadow-2xl w-full md:w-auto overflow-hidden transition-all duration-300">
      {/* Stat columns */}
      {statItems.map((item, idx) => (
        <div
          key={item.label}
          className={`flex flex-col items-center justify-center px-2 md:px-5 py-1.5 md:py-2.5 min-w-[50px] md:min-w-[80px] ${idx < statItems.length - 1 ? "border-r border-white/10" : ""}`}
        >
          <span className="text-xs md:text-base font-bold text-white leading-none tracking-tight">{item.value}</span>
          <span className="text-[7px] md:text-[9px] font-semibold text-gray-500 uppercase tracking-widest mt-1">{item.label}</span>
        </div>
      ))}

      {/* Est. Runtime with clock icon */}
      <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-5 py-1.5 md:py-2.5 border-l border-white/10 bg-white/5">
        <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 text-naija-gold/80 flex-shrink-0" />
        <div className="flex flex-col items-start">
          <span className="text-[7px] md:text-[9px] font-semibold text-gray-500 uppercase tracking-widest leading-none mb-0.5">Est. Runtime</span>
          <span className="text-xs md:text-sm font-bold text-white leading-none">
            {statistics.estimatedRuntime}<span className="text-[8px] md:text-[10px] font-normal text-gray-400 ml-0.5">min</span>
          </span>
        </div>
      </div>
    </div>
  );
};
