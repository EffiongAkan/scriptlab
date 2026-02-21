import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateAIContent, AIResponse } from "@/services/ai-service-enhanced";
import { useToast } from "@/hooks/use-toast";
import { Loader } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AIScriptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (content: string) => void;
  feature: 'dialogue' | 'scene' | 'cultural' | 'revision';
  scriptContext?: string;
}

export const AIScriptDialog = ({
  isOpen,
  onClose,
  onApply,
  feature,
  scriptContext = ''
}: AIScriptDialogProps) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [credits, setCredits] = useState<number | null>(null);

  const getDefaultPrompt = () => {
    switch (feature) {
      case 'dialogue':
        return 'Write compelling dialogue between [CHARACTER1] and [CHARACTER2] about [TOPIC].';
      case 'scene':
        return 'Create a scene description for [LOCATION] where [EVENT] happens.';
      case 'cultural':
        return 'Review this script excerpt for cultural sensitivity issues related to [CULTURE/GROUP].';
      case 'revision':
        return 'Improve this script excerpt by enhancing [CHARACTER DEVELOPMENT/DIALOGUE/ACTION/PACING].';
      default:
        return '';
    }
  };
  
  const getTitle = () => {
    switch (feature) {
      case 'dialogue': return 'Generate Dialogue';
      case 'scene': return 'Suggest Next Scene';
      case 'cultural': return 'Cultural Sensitivity Check';
      case 'revision': return 'Revise Script';
      default: return 'AI Assistant';
    }
  };
  
  const getDescription = () => {
    switch (feature) {
      case 'dialogue':
        return 'Create realistic dialogue between characters that sounds natural and advances the story.';
      case 'scene':
        return 'Generate a compelling scene description that sets the mood and visual elements.';
      case 'cultural':
        return 'Check your script for cultural sensitivity and authenticity issues.';
      case 'revision':
        return 'Get AI-powered suggestions to improve your script quality.';
      default:
        return 'Get AI assistance for your screenplay.';
    }
  };
  
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Input Required",
        description: "Please provide instructions for the AI.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setCredits(null);

    try {
      const response: AIResponse = await generateAIContent({
        prompt: prompt,
        context: scriptContext,
        maxTokens: 1000,
        temperature: 0.7,
        feature: feature
      });

      setCredits(
        typeof response.credits === "number"
          ? response.credits
          : null
      );

      if (response.success && response.content) {
        setGeneratedContent(response.content);
        toast({
          title: "Content Generated",
          description: "AI has created content based on your prompt.",
        });
      } else {
        // Improved: Detect credit errors and show custom error message
        if (response.error && (response.error.toLowerCase().includes("credit") || response.error.toLowerCase().includes("402"))) {
          setError("You have run out of AI credits. Please purchase more to continue using AI features.");
          toast({
            title: "No AI Credits",
            description: "You have run out of AI credits. Purchase more credits to keep using AI.",
            variant: "destructive"
          });
        } else {
          setError(response.error || "Failed to generate content. Please try again.");
          toast({
            title: "Generation Failed",
            description: response.error || "Failed to generate content. Please try again.",
            variant: "destructive"
          });
        }
        setGeneratedContent('');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      setCredits(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleApply = () => {
    onApply(generatedContent);
    onClose();
    toast({
      title: "Content Applied",
      description: "The generated content has been applied to your script."
    });
  };
  
  const handleClose = () => {
    setPrompt('');
    setGeneratedContent('');
    setError(null);
    onClose();
  };
  
  // Reset the prompt when the feature changes
  React.useEffect(() => {
    if (isOpen) {
      setPrompt(getDefaultPrompt());
      setGeneratedContent('');
      setError(null);
    }
  }, [feature, isOpen]);
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <label htmlFor="prompt" className="text-sm font-medium">Instructions for AI</label>
            <Textarea
              id="prompt"
              placeholder="Tell the AI what you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Error alert with AI credits info */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                {error}
                {typeof credits === "number" && (
                  <div className="mt-2 text-red-500 text-xs font-bold">
                    Remaining AI Credits: {credits}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Credits info (if not error, but present) */}
          {!error && typeof credits === "number" && (
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-muted-foreground">AI Credits:</span>
              <span
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  credits > 5
                    ? "bg-green-100 text-green-800"
                    : credits > 0
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {credits}
              </span>
            </div>
          )}

          {generatedContent && (
            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium">Generated Content</label>
              <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md max-h-64 overflow-y-auto">
                <pre className="whitespace-pre-wrap font-mono text-sm">{generatedContent}</pre>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <div className="space-x-2">
            {generatedContent ? (
              <Button onClick={handleApply}>Apply to Script</Button>
            ) : (
              <Button onClick={handleGenerate} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate'
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
