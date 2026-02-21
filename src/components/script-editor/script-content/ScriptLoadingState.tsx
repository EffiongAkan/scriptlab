import React from "react";
import { Loader, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
interface ScriptLoadingStateProps {
  isLoaded: boolean;
  loadError: string | null;
}
export const ScriptLoadingState = ({
  isLoaded,
  loadError
}: ScriptLoadingStateProps) => {
  return <div className="flex flex-col items-center justify-center my-16 space-y-4 text-gray-400">
      {!isLoaded ? <>
          <Loader className="w-10 h-10 animate-spin text-primary" />
          <p className="text-lg font-medium">Loading your script...</p>
        </> : loadError ? <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 max-w-md">
          <p className="font-medium">Error loading script</p>
          <p className="text-sm mt-1">{loadError}</p>
        </div> : <div className={cn("flex flex-col items-center justify-center space-y-4", "p-6 border-2 border-dashed border-gray-700 rounded-lg", "transition-all hover:border-primary/50")}>
          <FileText className="w-10 h-10 text-primary/70" />
          <div className="text-center">
            <p className="text-lg font-medium text-gray-300">Start writing your screenplay</p>
            <p className="text-sm text-gray-400 mt-1">Use Fountain syntax or the toolbar to format your script</p>
            
            <div className="mt-4 p-4 rounded-lg text-left bg-gray-100">
              <p className="font-medium mb-2 text-gray-300">Quick Fountain Syntax Guide:</p>
              <ul className="text-xs space-y-2 text-gray-400">
                <li><span className="font-mono bg-gray-800 px-1 rounded">INT./EXT. LOCATION - TIME</span>: Scene heading (all caps)</li>
                <li><span className="font-mono bg-gray-800 px-1 rounded">CHARACTER NAME</span>: Character name (all caps)</li>
                <li><span className="font-mono bg-gray-800 px-1 rounded">(parenthetical)</span>: Action or tone direction</li>
                <li><span className="font-mono bg-gray-800 px-1 rounded">Dialogue goes here...</span>: Character dialogue (follows character name)</li>
                <li><span className="font-mono bg-gray-800 px-1 rounded">Action description...</span>: Action (regular text)</li>
                <li><span className="font-mono bg-gray-800 px-1 rounded">CUT TO:</span>: Transition (followed by colon)</li>
              </ul>
              
              <div className="mt-4 text-gray-400">
                <p className="font-medium text-gray-300">How to Format with Fountain:</p>
                <ol className="text-xs list-decimal pl-4 space-y-1 mt-2">
                  <li>Scene headings start with INT. or EXT.</li>
                  <li>Character names are in ALL CAPS</li>
                  <li>Parentheticals go in (parentheses)</li>
                  <li>Dialogue follows character names</li>
                  <li>Action is written as normal text</li>
                  <li>Transitions end with TO:</li>
                </ol>
              </div>
            </div>
          </div>
        </div>}
    </div>;
};