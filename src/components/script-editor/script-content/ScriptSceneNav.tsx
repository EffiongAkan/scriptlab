
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Scene {
  id: string;
  content: string;
  number: number;
}

interface ScriptSceneNavProps {
  scenes: Scene[];
}

export const ScriptSceneNav: React.FC<ScriptSceneNavProps> = ({ scenes }) => {
  const [collapsed, setCollapsed] = useState(false);
  
  const scrollToScene = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className={cn(
      "bg-[#222222] border-r border-gray-800 overflow-y-auto transition-all duration-300 flex",
      collapsed ? "w-12" : "w-64",
    )}>
      <div className={cn(
        "flex flex-col flex-1",
        collapsed ? "items-center" : ""
      )}>
        <div className="p-2 border-b border-gray-800 flex justify-between items-center">
          {!collapsed && <h3 className="text-sm font-medium text-gray-300">Scenes</h3>}
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-400 hover:text-white p-1 h-auto"
            onClick={toggleCollapsed}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
        </div>
        
        <div className={cn("py-2", collapsed ? "hidden" : "")}>
          {scenes.length > 0 ? (
            scenes.map((scene) => (
              <button
                key={scene.id}
                onClick={() => scrollToScene(scene.id)}
                className={cn(
                  "w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 transition-colors",
                  "flex items-center"
                )}
              >
                <span className="w-6 text-gray-500 font-mono text-xs">{scene.number}.</span>
                <span className="truncate">{scene.content}</span>
              </button>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">No scenes yet</div>
          )}
        </div>
      </div>
    </div>
  );
};
