import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wand2, Loader2, Coins, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { generateAIContent } from '@/services/ai-service';
import { ScriptRecommendation } from '@/hooks/useEnhancedScriptAnalytics';
import { ScriptElementType } from '@/hooks/useScriptContent';

interface ImplementSuggestionsButtonProps {
  recommendations: ScriptRecommendation[];
  elements: ScriptElementType[];
  onImplemented: (updatedElements: ScriptElementType[]) => void;
  disabled?: boolean;
}

export const ImplementSuggestionsButton: React.FC<ImplementSuggestionsButtonProps> = ({
  recommendations,
  elements,
  onImplemented,
  disabled,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isImplementing, setIsImplementing] = useState(false);
  const { toast } = useToast();

  const actionableRecs = recommendations.filter(r => r.type !== 'strength');
  
  // Calculate dynamic credit cost based on number of scenes (headings)
  // At least 1 credit, otherwise 1 credit per scene
  const sceneCount = elements.filter(el => el.type === 'heading').length;
  const dynamicCreditCost = Math.max(1, sceneCount);

  const handleImplement = async () => {
    if (actionableRecs.length === 0) {
      toast({ title: 'No Recommendations', description: 'There are no actionable suggestions to implement.', variant: 'destructive' });
      return;
    }

    setIsImplementing(true);
    setShowConfirm(false);

    // Build the prompt from all recommendations
    const recommendationText = actionableRecs
      .map((rec, i) => `${i + 1}. [${rec.type.toUpperCase()}] ${rec.title}: ${rec.description}`)
      .join('\n');

    // Serialize the current script as plain text for context (Fountain format approximation)
    const scriptText = elements
      .map(el => {
        if (el.type === 'heading') return `\n${el.content.toUpperCase()}`;
        if (el.type === 'character') return `\n${el.content.toUpperCase()}`;
        if (el.type === 'dialogue') return el.content;
        if (el.type === 'parenthetical') {
          const content = el.content.startsWith('(') ? el.content : `(${el.content})`;
          return content;
        }
        if (el.type === 'transition') return `\n${el.content.toUpperCase()}`;
        return `\n${el.content}`; // Action
      })
      .join('\n');

    const prompt = `You are a professional screenplay editor. You have been given a script and a list of expert recommendations to improve it. 

RECOMMENDATIONS TO IMPLEMENT:
${recommendationText}

CURRENT SCRIPT:
${scriptText.substring(0, 8000)}

Your task:
- Review ONLY the critical and improvement recommendations above.
- Rewrite the affected portions of the script to address EVERY recommendation listed.
- Preserve all scene heading locations, character names, act structure, and core story beats.
- Return ONLY STRICT valid Fountain screenplay format. Do not add any explanation, commentary, or formatting tags (e.g. no [ACTION], [DIALOGUE], etc.).
- Each scene heading must be on its own line and start with INT. or EXT.
- Character names must be ALL CAPS on their own line.
- Dialogue must be on the line immediately following the Character name.
- Keep the tone and style consistent with the original.`;

    try {
      const response = await generateAIContent({
        prompt,
        feature: 'revision',
        maxTokens: 4000,
        temperature: 0.65,
        creditCost: dynamicCreditCost,
      });

      if (!response.success) {
        toast({
          title: 'Implementation Failed',
          description: response.error || 'AI could not implement the suggestions.',
          variant: 'destructive',
        });
        return;
      }

      // Parse the returned fountain text back into script elements
      const lines = response.content.split('\n').filter(l => l.trim());
      const newElements: ScriptElementType[] = [];
      
      lines.forEach((line, idx) => {
        let trimmed = line.trim();
        // Fallback: strip any AI added formatting tags if it ignored instructions
        trimmed = trimmed.replace(/^\[?(HEADING|ACTION|CHARACTER|DIALOGUE|PARENTHETICAL|TRANSITION|PAREN|SCENE HEADING)\]?\s*:?\s*/i, '');
        trimmed = trimmed.replace(/^(SCENE HEADING|CHARACTER|DIALOGUE|PARENTHETICAL|ACTION|TRANSITION):\s*/i, '');
        
        if (!trimmed) return;

        let type: ScriptElementType['type'] = 'action';

        if (/^(INT\.|EXT\.|INT\/EXT\.)/i.test(trimmed)) {
          type = 'heading';
        } else if (/^[A-Z][A-Z\s'.\-]{2,}$/.test(trimmed) && trimmed.length < 50) {
          type = 'character';
        } else if (/^\(.*\)$/.test(trimmed)) {
          type = 'parenthetical';
        } else if (/^(FADE IN:|FADE OUT:|CUT TO:|DISSOLVE TO:)/i.test(trimmed)) {
          type = 'transition';
        } else if (newElements.length > 0) {
          const prevEl = newElements[newElements.length - 1];
          if (prevEl?.type === 'character' || prevEl?.type === 'parenthetical') {
            type = 'dialogue';
          }
        }

        newElements.push({
          id: `ai-impl-${idx}-${Date.now()}`,
          type,
          content: trimmed,
        } as ScriptElementType);
      });

      onImplemented(newElements.filter(el => el.content.trim()));

      toast({
        title: '✅ Suggestions Implemented!',
        description: `${actionableRecs.length} recommendations applied. ${dynamicCreditCost} AI credits deducted.`,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsImplementing(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowConfirm(true)}
        disabled={disabled || isImplementing || actionableRecs.length === 0}
        className="bg-purple-500/10 text-purple-400 border-purple-500 hover:bg-purple-500 hover:text-white transition-all"
      >
        {isImplementing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Implementing...
          </>
        ) : (
          <>
            <Wand2 className="h-4 w-4 mr-2" />
            Implement All Suggestions
          </>
        )}
      </Button>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-[#1A1A2E] border-purple-500/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Wand2 className="h-5 w-5 text-purple-400" />
              AI-Implement All Suggestions
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-sm leading-relaxed">
              The AI will rewrite and improve your script based on all the analysis recommendations.
              This is a powerful action — review your current script first as the changes will be significant.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* Recommendation summary */}
            <div className="bg-white/5 rounded-lg p-3 space-y-2 text-sm">
              {actionableRecs.filter(r => r.type === 'critical').length > 0 && (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{actionableRecs.filter(r => r.type === 'critical').length} critical issue{actionableRecs.filter(r => r.type === 'critical').length !== 1 ? 's' : ''} to fix</span>
                </div>
              )}
              {actionableRecs.filter(r => r.type === 'improvement').length > 0 && (
                <div className="flex items-center gap-2 text-yellow-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{actionableRecs.filter(r => r.type === 'improvement').length} improvement{actionableRecs.filter(r => r.type === 'improvement').length !== 1 ? 's' : ''} to apply</span>
                </div>
              )}
            </div>

            {/* Credit cost */}
            <div className="flex items-center justify-between bg-purple-500/10 border border-purple-500/30 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2 text-purple-300 text-sm">
                <Coins className="h-4 w-4" />
                AI Credits Required ({sceneCount} scene{sceneCount !== 1 ? 's' : ''})
              </div>
              <span className="text-purple-200 font-bold">{dynamicCreditCost} {dynamicCreditCost === 1 ? 'credit' : 'credits'}</span>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              ⚠️ This will overwrite the current script content with an AI-improved version. Make sure to export or version-save your script before proceeding.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setShowConfirm(false)} className="text-gray-400">
              Cancel
            </Button>
            <Button
              onClick={handleImplement}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Implement ({dynamicCreditCost} credits)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
