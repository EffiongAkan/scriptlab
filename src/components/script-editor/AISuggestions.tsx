
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { AIScriptDialog } from "./AIScriptDialog";
import { useScriptContent } from "@/hooks/useScriptContent";
import { useScriptEditor } from "@/contexts/ScriptEditorContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wand2, MessageCircle, Palmtree, Globe, FileEdit, Users, MapPin } from "lucide-react";
import { validateCulturalAuthenticity, suggestNigerianNames, suggestNigerianLocations } from "@/services/cultural-validation";

interface AISuggestionsProps {
  scriptId: string;
}

export const AISuggestions = ({ scriptId }: AISuggestionsProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState<'dialogue' | 'scene' | 'cultural' | 'revision'>('dialogue');
  const { elements, addElement } = useScriptContent(scriptId || '');
  const { insertScriptElement } = useScriptEditor();
  const { toast } = useToast();
  const [showCulturalAnalysis, setShowCulturalAnalysis] = useState(false);
  
  const handleOpenDialog = (feature: 'dialogue' | 'scene' | 'cultural' | 'revision') => {
    setActiveFeature(feature);
    setIsDialogOpen(true);
  };
  
  const getScriptContext = () => {
    // Get the last 5 elements or fewer if there aren't that many
    if (!elements || elements.length === 0) {
      return "No script content available yet.";
    }
    
    const contextElements = elements.slice(-5);
    return contextElements.map(el => 
      `${el.type.toUpperCase()}: ${el.content}`
    ).join('\n\n');
  };

  // Get cultural analysis of current script
  const getCulturalAnalysis = () => {
    if (!elements || elements.length === 0) {
      return null;
    }
    
    const scriptText = elements.map(el => el.content).join(' ');
    return validateCulturalAuthenticity(scriptText);
  };

  const culturalAnalysis = getCulturalAnalysis();
  
  const handleApplyContent = (content: string) => {
    if (!scriptId) {
      toast({
        title: "Error",
        description: "No script ID found. Cannot apply content.",
        variant: "destructive"
      });
      return;
    }

    // Clean up and process the generated content
    const lines = content.split('\n').filter(line => line.trim());
    
    switch (activeFeature) {
      case 'dialogue': {
        // Try to identify character and dialogue patterns
        let currentCharacter = "";
        
        lines.forEach(line => {
          const characterMatch = line.match(/^([A-Z][A-Z\s]+):/);
          
          if (characterMatch) {
            // This line starts with a character name
            currentCharacter = characterMatch[1].trim();
            addElement('character', currentCharacter);
            
            // Get the dialogue part after the character name
            const dialogueText = line.substring(line.indexOf(':') + 1).trim();
            if (dialogueText) {
              addElement('dialogue', dialogueText);
            }
          } else if (currentCharacter && line.trim()) {
            // Continue dialogue for the current character
            addElement('dialogue', line.trim());
          } else if (line.trim().startsWith('(') && line.trim().endsWith(')')) {
            // This is likely a parenthetical
            addElement('parenthetical', line.trim());
          } else {
            // Default to action for everything else
            addElement('action', line.trim());
          }
        });
        break;
      }
      
      case 'scene': {
        // Try to identify scene headings and action
        const firstLine = lines[0]?.trim();
        if (firstLine && (firstLine.includes('INT.') || firstLine.includes('EXT.'))) {
          addElement('heading', firstLine);
          
          // Rest of the lines become action
          const remainingLines = lines.slice(1);
          if (remainingLines.length > 0) {
            addElement('action', remainingLines.join('\n'));
          }
        } else {
          // If no proper heading format, create a standard heading and then action
          addElement('heading', 'INT. LOCATION - DAY');
          addElement('action', lines.join('\n'));
        }
        break;
      }
      
      case 'cultural':
      case 'revision': {
        // Add as action element with header
        addElement('action', `${activeFeature.toUpperCase()} NOTES:\n${content}`);
        break;
      }
    }
    
    toast({
      title: "Content Added",
      description: "AI generated content has been added to your script."
    });
  };

  const handleQuickInsert = (type: 'nigerian-names' | 'nigerian-locations') => {
    switch (type) {
      case 'nigerian-names':
        const names = suggestNigerianNames();
        const namesText = `SUGGESTED NIGERIAN NAMES:\n${names.join(', ')}`;
        addElement('action', namesText);
        break;
      case 'nigerian-locations':
        const locations = suggestNigerianLocations();
        const locationsText = `SUGGESTED NIGERIAN LOCATIONS:\n${locations.join(', ')}`;
        addElement('action', locationsText);
        break;
    }
    
    toast({
      title: "Content Added",
      description: "Suggestions have been added to your script."
    });
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          AI Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cultural Analysis Summary */}
        {culturalAnalysis && (
          <div className="p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Cultural Authenticity</span>
              <Badge variant={culturalAnalysis.score >= 70 ? "default" : culturalAnalysis.score >= 40 ? "secondary" : "destructive"}>
                {culturalAnalysis.score}/100
              </Badge>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs"
              onClick={() => setShowCulturalAnalysis(!showCulturalAnalysis)}
            >
              {showCulturalAnalysis ? 'Hide' : 'Show'} Analysis
            </Button>
            
            {showCulturalAnalysis && (
              <div className="mt-2 space-y-2 text-xs">
                {culturalAnalysis.enhancements.length > 0 && (
                  <div>
                    <p className="font-medium text-green-600">Strengths:</p>
                    {culturalAnalysis.enhancements.map((enhancement, i) => (
                      <p key={i} className="text-muted-foreground">• {enhancement}</p>
                    ))}
                  </div>
                )}
                {culturalAnalysis.suggestions.length > 0 && (
                  <div>
                    <p className="font-medium text-blue-600">Suggestions:</p>
                    {culturalAnalysis.suggestions.map((suggestion, i) => (
                      <p key={i} className="text-muted-foreground">• {suggestion}</p>
                    ))}
                  </div>
                )}
                {culturalAnalysis.warnings.length > 0 && (
                  <div>
                    <p className="font-medium text-red-600">Warnings:</p>
                    {culturalAnalysis.warnings.map((warning, i) => (
                      <p key={i} className="text-muted-foreground">• {warning}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* AI Generation Buttons */}
        <div className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => handleOpenDialog('dialogue')}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Generate Dialogue
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => handleOpenDialog('scene')}
          >
            <Palmtree className="w-4 h-4 mr-2" />
            Suggest Next Scene
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => handleOpenDialog('cultural')}
          >
            <Globe className="w-4 h-4 mr-2" />
            Cultural Check
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => handleOpenDialog('revision')}
          >
            <FileEdit className="w-4 h-4 mr-2" />
            AI Revision
          </Button>
        </div>

        {/* Quick Cultural Tools */}
        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-2">Quick Nigerian Tools</p>
          <div className="space-y-2">
            <Button 
              variant="ghost" 
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => handleQuickInsert('nigerian-names')}
            >
              <Users className="w-3 h-3 mr-2" />
              Insert Nigerian Names
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => handleQuickInsert('nigerian-locations')}
            >
              <MapPin className="w-3 h-3 mr-2" />
              Insert Nigerian Locations
            </Button>
          </div>
        </div>
      </CardContent>
      
      <AIScriptDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onApply={handleApplyContent}
        feature={activeFeature}
        scriptContext={getScriptContext()}
      />
    </Card>
  );
};
