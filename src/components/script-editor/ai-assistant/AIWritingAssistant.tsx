import React, { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Wand2, MessageSquare, Sparkles } from "lucide-react";
import { RealTimeSuggestions } from "./RealTimeSuggestions";
import { FloatingPanel } from "@/components/common/FloatingPanel";

export const AIWritingAssistant = ({
  scriptId,
  elements,
  onApplySuggestion,
}: {
  scriptId: string;
  elements: any[];
  onApplySuggestion: (elementId: string, content: string) => void;
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentElement, setCurrentElement] = useState<any>(null);
  
  const handleGenerate = (prompt: string) => {
    setIsGenerating(true);
    // Simulate AI generation
    setTimeout(() => {
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="relative">
      {/* Render RealTimeSuggestions inside a floating panel */}
      <FloatingPanel className="max-h-[90vh]">
        <RealTimeSuggestions
          scriptId={scriptId}
          currentElement={currentElement}
          elements={elements}
          onApplySuggestion={onApplySuggestion}
          isGenerating={isGenerating}
          onGenerate={handleGenerate}
        />
      </FloatingPanel>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Writing Assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Use our AI assistant to help you write your script. Generate dialogue, scenes, and more.
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="mr-2 h-4 w-4" />
                Dialogue
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Sparkles className="mr-2 h-4 w-4" />
                Scene
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Wand2 className="mr-2 h-4 w-4" />
                Character
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Bot className="mr-2 h-4 w-4" />
                Plot
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              AI Tools
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Advanced AI tools to enhance your script writing experience.
            </p>
            
            <div className="space-y-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Bot className="mr-2 h-4 w-4" />
                    Script Analysis
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px]">
                  <div className="space-y-4 py-4">
                    <h3 className="text-lg font-medium">Script Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      AI-powered analysis of your script structure, pacing, and more.
                    </p>
                  </div>
                </SheetContent>
              </Sheet>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Character Development
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-2">
                    <h4 className="font-medium">Character Development</h4>
                    <p className="text-sm text-muted-foreground">
                      Generate character backgrounds, motivations, and arcs.
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="mr-2 h-4 w-4" />
                Dialogue Enhancement
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
