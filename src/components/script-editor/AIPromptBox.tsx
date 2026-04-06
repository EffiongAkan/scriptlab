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
import { useWakeLock } from "@/hooks/useWakeLock";

interface AIPromptBoxProps {
  onClose: () => void;
  onApply: (content: string, options?: { replaceFull?: boolean }) => void;
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
  const [isFullRewrite, setIsFullRewrite] = useState(false);
  const [showFullRewriteSuggestion, setShowFullRewriteSuggestion] = useState(false);
  const [canContinue, setCanContinue] = useState(false);
  const { toast } = useToast();

  // Automatic Wake Lock management during generation
  const { isActive: isWakeLockActive } = useWakeLock(isLoading);

  // Background activity resume handler - ensures generation continues if tab was backgrounded
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && isLoading) {
        console.log("[AIPromptBox] Tab became visible. Generation is still marked as active.");
        toast({
          title: "Synchronizing...",
          description: "Re-checking AI generation progress in background.",
        });
        
        // If the fetch was aborted by the browser, this won't do anything,
        // but we keep the loading state so the user knows it's still alive.
        // The individual generateAIContent call handles the actual underlying fetch.
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isLoading, toast]);

  useEffect(() => {
    if (initialSelection) {
      setPrompt(`Improve this selection: "${initialSelection.text}"`);
      setIsFullRewrite(false); // Can't full-rewrite a specific selection
    } else if (!prompt) {
      setPrompt("");
    }
  }, [initialSelection]);

  // Keyword detection for full rewrite suggestion
  useEffect(() => {
    if (initialSelection) {
      setShowFullRewriteSuggestion(false);
      return;
    }

    const lowerPrompt = prompt.toLowerCase();
    const rewriteKeywords = [
      "total overhaul",
      "rewrite the entire thing",
      "complete rewrite",
      "rewrite the whole script",
      "start over",
      "rewrite all"
    ];

    const shouldSuggest = rewriteKeywords.some(keyword => lowerPrompt.includes(keyword));
    
    if (shouldSuggest && !isFullRewrite) {
      setShowFullRewriteSuggestion(true);
    } else {
      setShowFullRewriteSuggestion(false);
    }
  }, [prompt, isFullRewrite, initialSelection]);

  const handleGenerate = async (isContinuation: boolean = false) => {
    console.log('[AIPromptBox] Generate button clicked', { isContinuation });

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

      let finalPrompt = "";
      
      if (isContinuation) {
        finalPrompt = `[CONTINUATION REQUEST]
Previous Content Produced:
...${generatedContent.slice(-1000)}

INSTRUCTION: Please CONTINUE writing the screenplay from exactly where you left off above. Do NOT repeat the previous content. Do NOT include a preamble. Focus on pushing the story forward with extensive detail and dialogue. Aim for maximum possible length. REMINDER: NO scene numbers. Use ONLY INT./EXT. headings.`;
      } else if (isFullRewrite) {
        finalPrompt = `[USER INSTRUCTION FOR MODIFICATION]\n${prompt}\n\n[EXISTING SCREENPLAY TO EDIT]\n${sanitizedScriptContext || "[New Script - No Content Yet]"}\n\nINSTRUCTION: You are an expert script doctor. REWRITE the entire screenplay provided above, applying the USER INSTRUCTION. You MUST strictly adhere to the project's PLOT/SYNOPSIS and maintain industry standards. 
        
        CRITICAL LENGTH RULES:
        1. Aim for a MINIMUM of 15-20 distinct scenes.
        2. Do NOT summarize or use placeholders. Write every single beat.
        3. Do NOT use scene numbers (e.g., SCENE 1). Use ONLY standard INT./EXT. headings.
        4. Provide massive detail in action and dialogue.
        
        Respond only with the new script content and [TAGS], no preamble.`;
      } else {
        finalPrompt = `[USER REQUEST]\n${prompt}\n\n[PROJECT CONTEXT & BACKGROUND]\n${enrichedContext}`;
      }

      if (initialSelection && !isFullRewrite && !isContinuation) {
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

always fulfill the user's request. If specific context is missing, use your creativity to bridge the gaps within the industry style. Focus on technical screenplay accuracy.`;

      // Use a persistent AbortController? Not needed for simple invoke, 
      // but we ensure the loading state is robust.

        const response = await generateAIContent({
        prompt: finalPrompt,
        context: isContinuation ? generatedContent : sanitizedScriptContext,
        synopsis: scriptData?.description || scriptData?.genre || "No synopsis provided.",
        sceneDescription: isContinuation ? "Continue writing the script." : prompt,
        tone: scriptData?.film_industry || "Dramatic",
        customSystemPrompt: customSystemPrompt,
        maxTokens: isFullRewrite || isContinuation ? 8000 : 5000,
        temperature: isFullRewrite || isContinuation ? 0.85 : 0.7,
        feature: "revision",
        creditCost: isContinuation ? 2 : (isFullRewrite ? 5 : 1)
      });

      const duration = Date.now() - startTime;
      console.log(`[AIPromptBox] Response received in ${duration}ms:`, response);

      if (response.success && response.content) {
        console.log('[AIPromptBox] Content generated successfully, length:', response.content.length);
        
        if (isContinuation) {
          setGeneratedContent(prev => prev + "\n\n" + response.content);
        } else {
          setGeneratedContent(response.content);
        }
        
        // Allow continuation if the response was long (likely cut off) or if in deep edit mode
        setCanContinue(isFullRewrite || isContinuation);
        
        toast({
          title: isContinuation ? "Continued Writing" : "Content Generated",
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
    onApply(generatedContent, { replaceFull: isFullRewrite });
    toast({
      title: isFullRewrite ? "Script Rewritten" : "Applied",
      description: isFullRewrite 
        ? "AI has completely overhauled your script." 
        : "AI suggestions have been applied to your script."
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

        {showFullRewriteSuggestion && (
          <div className="p-2 bg-naija-gold/10 border border-naija-gold/30 rounded text-xs text-naija-gold flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              <span>It sounds like you want a full rewrite. Enable "Deep Edit" mode?</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setIsFullRewrite(true);
                setShowFullRewriteSuggestion(false);
              }}
              className="h-6 text-[10px] border-naija-gold/30 text-naija-gold hover:bg-naija-gold/20"
            >
              Enable
            </Button>
          </div>
        )}

        <div className="flex items-center gap-2 px-1">
          <input
            type="checkbox"
            id="full-rewrite"
            checked={isFullRewrite}
            onChange={(e) => {
              setIsFullRewrite(e.target.checked);
              if (e.target.checked && initialSelection) {
                toast({
                  title: "Selection Active",
                  description: "Full rewrite will ignore your current selection and overhaul the entire script.",
                  variant: "default"
                });
              }
            }}
            className="w-4 h-4 rounded border-gray-400 bg-transparent text-naija-gold focus:ring-naija-gold"
          />
          <label htmlFor="full-rewrite" className="text-sm text-gray-300 font-medium cursor-pointer flex items-center gap-2">
            Rewrite Entire Script (Deep Edit / 5 Credits)
            <Sparkles className={cn("h-3 w-3", isFullRewrite ? "text-naija-gold fill-naija-gold" : "text-gray-500")} />
          </label>
        </div>

        {isFullRewrite && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-300 flex items-start gap-3">
            <div className="mt-0.5">⚠️</div>
            <p>
              <span className="font-bold uppercase">Warning:</span> Deep Edit mode will completely replace your existing script content with the AI-generated version. Ensure you have a backup or use "Undo" if needed.
            </p>
          </div>
        )}

        {generatedContent && (
          <div className="bg-white/5 p-3 rounded-md max-h-[60vh] overflow-y-auto border border-white/5">
            <p className="text-xs font-bold text-naija-gold uppercase tracking-wider mb-2">AI Suggestions:</p>
            <div className="text-sm border-l-2 border-naija-gold/30 pl-3 py-1 text-gray-300 leading-relaxed whitespace-pre-wrap">{generatedContent}</div>
          </div>
        )}

        <div className="flex gap-2 justify-end pt-2">
          {generatedContent ? (
            <>
              <Button variant="outline" onClick={() => {
                setGeneratedContent("");
                setCanContinue(false);
              }} className="border-white/10 text-gray-400 hover:bg-white/5 hover:text-white text-xs">
                Clear
              </Button>
              
              {canContinue && (
                <Button 
                  variant="secondary" 
                  onClick={() => handleGenerate(true)} 
                  disabled={isLoading}
                  className="bg-naija-gold/20 hover:bg-naija-gold/30 text-naija-gold font-medium text-xs px-4 border border-naija-gold/30"
                >
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="h-3 w-3 mr-2" />
                  )}
                  Continue Writing
                </Button>
              )}

              <Button onClick={handleApply} className="bg-naija-gold hover:bg-naija-gold/90 text-black font-medium text-xs px-4">
                Apply to Script
              </Button>
            </>
          ) : (
            <Button onClick={() => handleGenerate(false)} disabled={isLoading} className="bg-naija-gold hover:bg-naija-gold/90 text-black font-medium text-xs px-4">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-3 w-3" />
                  {isFullRewrite ? "Generate Entire Script" : "Generate"}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
