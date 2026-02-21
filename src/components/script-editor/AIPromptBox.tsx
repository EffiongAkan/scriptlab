import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Sparkles, Loader2 } from "lucide-react";
import { generateAIContent } from "@/services/ai-service-enhanced";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ScriptData } from "@/hooks/useScriptContent";
import { getIndustryAIPromptContext, getIndustryDisplayInfo } from "@/utils/filmIndustryContext";
import { FilmIndustry } from "@/types";

interface AIPromptBoxProps {
  onClose: () => void;
  onApply: (content: string) => void;
  scriptContext?: string;
  className?: string;
  scriptData?: ScriptData;
  characters?: any[];
  initialSelection?: { text: string; elementId?: string };
}

export const AIPromptBox: React.FC<AIPromptBoxProps> = ({
  onClose,
  onApply,
  scriptContext = "",
  className,
  scriptData,
  characters = [],
  initialSelection
}) => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (initialSelection) {
      setPrompt(`Improve this selection: "${initialSelection.text}"`);
    } else if (!prompt) {
      setPrompt("");
    }
  }, [initialSelection]);

  const handleGenerate = async () => {
    console.log('[AIPromptBox] Generate button clicked');

    if (!prompt.trim()) {
      toast({
        title: "Input Required",
        description: "Please provide instructions for the AI.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    toast({
      title: "Generating...",
      description: "AI is working on your request. Please wait...",
    });

    try {
      const startTime = Date.now();

      // Sanitization: Ensure scriptContext doesn't pass "undefined" or null strings
      const sanitizedScriptContext = (scriptContext || "")
        .replace(/undefined/gi, "")
        .replace(/null/gi, "")
        .trim();

      // Build enriched context
      let enrichedContext = `Script Title: ${scriptData?.title || 'Untitled Script'}\n`;

      // Add Industry Context
      if (scriptData?.film_industry) {
        const industryContext = getIndustryAIPromptContext(scriptData.film_industry as FilmIndustry);
        enrichedContext += `\n--- INDUSTRY STYLE & STANDARDS ---\n${industryContext}\n`;
      }

      // Add Synopsis/Genre with Commandative Fallback for "From Scratch" scripts
      if (scriptData?.description || scriptData?.genre) {
        enrichedContext += `\n--- PROJECT OVERVIEW ---\n`;
        if (scriptData.genre) enrichedContext += `Genre: ${scriptData.genre}\n`;
        if (scriptData.description) enrichedContext += `Synopsis: ${scriptData.description}\n`;
      } else {
        enrichedContext += `\n--- PROJECT OVERVIEW ---\nINSTRUCTION: This is a new project with no existing synopsis. You are hereby COMMANDED to use your creativity to invent compelling story details on-the-fly that fit the specified industry standards. Do NOT refuse due to missing information.\n`;
      }

      // Add Characters with Commandative Fallback
      if (characters && characters.length > 0) {
        enrichedContext += `\n--- KEY CHARACTERS ---\n`;
        characters.forEach(char => {
          const personalityStr = Array.isArray(char.personality) ? char.personality.join(', ') : char.personality;
          enrichedContext += `- ${char.name.toUpperCase()}:\n  Personality: ${personalityStr || 'Not specified'}\n  Background: ${char.background || 'No details provided'}\n`;
        });
      } else {
        enrichedContext += `\n--- KEY CHARACTERS ---\nINSTRUCTION: Characters are not yet defined. You are hereby COMMANDED to invent believable characters for this scene as needed. Proceed directly to the user's request.\n`;
      }

      // Add actual script content
      enrichedContext += `\n--- RECENT SCRIPT EXCERPT ---\n${sanitizedScriptContext || "[New Script - No Content Yet]"}`;

      let finalPrompt = `[USER REQUEST]\n${prompt}\n\n[PROJECT CONTEXT & BACKGROUND]\n${enrichedContext}`;

      if (initialSelection) {
        finalPrompt += `\n\n[SPECIFIC SELECTION TO MODIFY]\n"${initialSelection.text}"`;
        finalPrompt += `\n\nINSTRUCTION: Reword or improve the text above. Maintain the same formatting.`;
      }

      finalPrompt += `\n\n[FINAL INSTRUCTION]\nDo not refuse the request. If metadata is missing, invent it creatively within the industry style. Focus on generating high-quality screenplay elements. Respond only with the script content, no preamble.`;

      const industryPromptContext = scriptData?.film_industry
        ? getIndustryAIPromptContext(scriptData.film_industry as FilmIndustry)
        : "";

      const customSystemPrompt = `You are an expert professional screenwriter. 

STRICT FORMATTING RULES:
1. Character names MUST be ALL CAPS on their own line.
2. Dialogue MUST immediately follow the character name (or parenthetical) on its own line.
3. Scene headings (INT./EXT.) MUST be ALL CAPS and clearly separate scenes.
4. Do NOT use Markdown (bold, italics, etc.) within script elements.
5. If you are modifying an existing scene, you MUST start with the scene heading (e.g., SCENE 1 or INT. LOCATION - TIME).
6. AVOID using ALL CAPS for emphasis within dialogue if the dialogue is short and on its own line, as it may be misidentified as a character name. Ensure character names are distinct and followed immediately by dialogue.

${industryPromptContext ? `INDUSTRY STYLE GUIDE:\n${industryPromptContext}` : ""}

Always fulfill the user's request. If specific context is missing, use your creativity to bridge the gaps within the industry style. Focus on technical screenplay accuracy.`;

      const response = await generateAIContent({
        prompt: finalPrompt, // Pass the combined prompt here
        context: enrichedContext,
        synopsis: enrichedContext,
        sceneDescription: prompt,
        tone: scriptData?.film_industry || "Dramatic",
        customSystemPrompt: customSystemPrompt,
        maxTokens: 5000,
        temperature: 0.7,
        feature: "revision"
      });

      const duration = Date.now() - startTime;
      console.log(`[AIPromptBox] Response received in ${duration}ms:`, response);

      if (response.success && response.content) {
        console.log('[AIPromptBox] Content generated successfully, length:', response.content.length);
        setGeneratedContent(response.content);
        toast({
          title: "Content Generated",
          description: "AI has created suggestions based on your prompt.",
        });
      } else {
        console.error('[AIPromptBox] Generation failed:', response.error, 'ErrorType:', response.errorType);

        let errorMessage = response.error || "Failed to generate content.";

        // Provide more helpful error messages
        if (response.errorType === 'auth') {
          errorMessage = "Authentication failed. Please try logging out and back in.";
        } else if (response.errorType === 'credits') {
          errorMessage = "You have run out of AI credits. Please purchase more to continue.";
        } else if (response.errorType === 'service') {
          errorMessage = "AI service is temporarily unavailable. Please try again later.";
        } else if (response.errorType === 'network') {
          errorMessage = "Network error. Please check your internet connection.";
        }

        toast({
          title: "Generation Failed",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('[AIPromptBox] Exception caught:', error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      console.log('[AIPromptBox] Generation process completed');
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    onApply(generatedContent);
    toast({
      title: "Applied",
      description: "AI suggestions have been applied to your script."
    });
    onClose();
  };

  const industryInfo = scriptData?.film_industry
    ? getIndustryDisplayInfo(scriptData.film_industry as FilmIndustry)
    : null;

  return (
    <Card className={cn("p-4 shadow-lg border-primary/20 bg-[#1e1e1e] text-white", className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-naija-gold" />
            <h3 className="font-semibold text-gray-100">AI Script Assistant</h3>
          </div>
          {industryInfo && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-naija-gold/10 text-naija-gold text-[10px] font-medium border border-naija-gold/20 w-fit">
              <span>{industryInfo.emoji}</span>
              <span>{industryInfo.name} Style</span>
            </div>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white hover:bg-white/10">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {initialSelection && (
          <div className="p-2 bg-teal-500/10 border border-teal-500/30 rounded text-xs text-teal-300 italic flex items-center gap-2">
            <Sparkles className="w-3 h-3" />
            <span>Focusing on selection: "{initialSelection.text.substring(0, 50)}{initialSelection.text.length > 50 ? '...' : ''}"</span>
          </div>
        )}

        <Textarea
          placeholder="Ask AI to improve your script, add dialogue, enhance scenes, fix pacing, etc..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[100px] resize-none bg-white/5 border-white/10 text-gray-200 placeholder:text-gray-500 focus-visible:ring-naija-gold/50"
          disabled={isLoading}
        />

        {generatedContent && (
          <div className="bg-white/5 p-3 rounded-md max-h-[60vh] overflow-y-auto border border-white/5">
            <p className="text-xs font-bold text-naija-gold uppercase tracking-wider mb-2">AI Suggestions:</p>
            <div className="text-sm border-l-2 border-naija-gold/30 pl-3 py-1 text-gray-300 leading-relaxed whitespace-pre-wrap">{generatedContent}</div>
          </div>
        )}

        <div className="flex gap-2 justify-end pt-2">
          {generatedContent ? (
            <>
              <Button variant="outline" onClick={() => setGeneratedContent("")} className="border-white/10 text-gray-400 hover:bg-white/5 hover:text-white text-xs">
                Clear
              </Button>
              <Button onClick={handleApply} className="bg-naija-gold hover:bg-naija-gold/90 text-black font-medium text-xs px-4">
                Apply to Script
              </Button>
            </>
          ) : (
            <Button onClick={handleGenerate} disabled={isLoading} className="bg-naija-gold hover:bg-naija-gold/90 text-black font-medium text-xs px-4">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-3 w-3" />
                  Generate
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
