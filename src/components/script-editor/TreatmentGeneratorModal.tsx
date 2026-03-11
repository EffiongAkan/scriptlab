import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Save, X, FileText } from "lucide-react";
import { generateAIContent } from "@/services/ai-service-enhanced";
import { useToast } from "@/hooks/use-toast";
import { ScriptData, ScriptElementType } from "@/hooks/useScriptContent";
import { FilmIndustry, Genre } from "@/types";

interface TreatmentGeneratorModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    scriptData: ScriptData | null;
    scriptElements: ScriptElementType[];
    onSaveTreatment: (treatmentText: string) => Promise<void>;
    currentTreatment?: string;
}

export const TreatmentGeneratorModal: React.FC<TreatmentGeneratorModalProps> = ({
    isOpen,
    onOpenChange,
    scriptData,
    scriptElements,
    onSaveTreatment,
    currentTreatment = ""
}) => {
    const [treatment, setTreatment] = useState(currentTreatment);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen) {
            setTreatment(currentTreatment);
        }
    }, [isOpen, currentTreatment]);

    const handleGenerate = async () => {
        if (scriptElements.length === 0) {
            toast({
                title: "Script is empty",
                description: "Please write some script content before generating a treatment.",
                variant: "destructive",
            });
            return;
        }

        setIsGenerating(true);
        toast({
            title: "Generating Treatment...",
            description: "AI is analyzing your script and creating a prose summary. This may take a minute.",
        });

        try {
            // Build context from the script
            const scriptText = scriptElements
                .map(el => {
                    if (el.type === 'heading') return `\n[Scene: ${el.content}]`;
                    if (el.type === 'character') return `\n${el.content}: `;
                    if (el.type === 'dialogue') return `"${el.content}"`;
                    return el.content;
                })
                .join(' ');

            const combinedContext = `
${scriptData?.title ? `Title: ${scriptData.title}\n` : ''}
${scriptData?.film_industry ? `Industry/Tone: ${scriptData.film_industry}\n` : ''}
${scriptData?.description ? `Logline/Synopsis: ${scriptData.description}\n` : ''}

SCRIPT EXCERPT:
${scriptText}
`;

            const prompt = `Based on the provided screenplay content, write a comprehensive and engaging treatment (prose summary of the story).
The treatment should be written in present tense, focusing on the main characters, the core conflict, the rising action, climax, and resolution.
Make it compelling, professional, and ready to be used as a pitch document.`;

            const response = await generateAIContent({
                prompt,
                context: combinedContext,
                synopsis: "", // Send empty string so Edge Function uses 'context' rather than ignoring it
                sceneDescription: "Treatment generation",
                tone: scriptData?.film_industry || "Dramatic",
                maxTokens: 3000,
                temperature: 0.7,
                feature: "development"
            });

            if (response.success && response.content) {
                setTreatment(response.content);
                toast({
                    title: "Treatment Generated",
                    description: "Your treatment is ready. You can edit it before saving.",
                });
            } else {
                throw new Error(response.error || "Failed to generate treatment");
            }
        } catch (error) {
            console.error('Treatment generation failed:', error);
            toast({
                title: "Generation Failed",
                description: error instanceof Error ? error.message : "An unexpected error occurred.",
                variant: "destructive"
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSaveTreatment(treatment);
            toast({
                title: "Treatment Saved",
                description: "Your script treatment has been updated successfully.",
            });
            onOpenChange(false);
        } catch (error) {
            toast({
                title: "Save Failed",
                description: "Could not save the treatment. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] h-[85vh] flex flex-col bg-[#1A1A1A] text-white border-gray-800">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <FileText className="h-5 w-5 text-naija-gold" />
                            Script Treatment
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-gray-400">
                        A treatment is a prose summary of your script, often used for pitching. You can write your own or generate one using AI based on your current script content.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex flex-col gap-4 mt-4 overflow-hidden relative">
                    <Textarea
                        value={treatment}
                        onChange={(e) => setTreatment(e.target.value)}
                        placeholder="Your story treatment will appear here. Click 'Generate with AI' to let ScriptLab analyze your script and write one for you."
                        className="flex-1 resize-none font-sans text-sm leading-relaxed p-4 bg-[#121212] border-gray-700 text-gray-200 focus-visible:ring-naija-gold/50"
                        disabled={isGenerating}
                    />
                    {isGenerating && (
                        <div className="absolute inset-0 bg-[#121212]/50 backdrop-blur-sm flex items-center justify-center flex-col gap-3 rounded-md border border-gray-700">
                            <Loader2 className="h-8 w-8 animate-spin text-naija-gold" />
                            <p className="text-sm text-naija-gold font-medium animate-pulse">Analyzing script and crafting treatment...</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-800">
                    <Button
                        variant="outline"
                        onClick={handleGenerate}
                        disabled={isGenerating || isSaving}
                        className="bg-transparent border-naija-gold/50 text-naija-gold hover:bg-naija-gold/10"
                    >
                        {isGenerating ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        Generate with AI
                    </Button>

                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="text-gray-400 hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isGenerating || isSaving || !treatment.trim()}
                            className="bg-naija-green hover:bg-naija-green/90 text-white"
                        >
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            Save Treatment
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
