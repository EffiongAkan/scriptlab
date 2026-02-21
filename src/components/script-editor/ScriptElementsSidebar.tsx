
import React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useScriptEditor } from "@/contexts/ScriptEditorContext";
import { FileText, MessageSquare, User, Square, ChevronRight, ArrowRightLeft } from "lucide-react";

interface ScriptElementsSidebarProps {
  scriptId: string;
}

export const ScriptElementsSidebar = ({ scriptId }: ScriptElementsSidebarProps) => {
  const { insertScriptElement } = useScriptEditor();

  const scriptElements = [
    { type: "heading", label: "Scene Heading", icon: FileText },
    { type: "action", label: "Action", icon: Square },
    { type: "character", label: "Character", icon: User },
    { type: "dialogue", label: "Dialogue", icon: MessageSquare },
    { type: "parenthetical", label: "Parenthetical", icon: ChevronRight },
    { type: "transition", label: "Transition", icon: ArrowRightLeft },
  ] as const;

  return (
    <div className="bg-[#272727] p-1 rounded-lg border border-gray-800">
      <div className="flex flex-col gap-1">
        {scriptElements.map((element) => (
          <TooltipProvider key={element.type}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-10 h-10 bg-[#333333] border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                  onClick={() => insertScriptElement(element.type)}
                  aria-label={element.label}
                >
                  <element.icon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="bg-gray-900 text-white border-gray-700">
                <p>{element.label}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
};
