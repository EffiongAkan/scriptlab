import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, Coins } from "lucide-react";
import { useAICredits, deductAICredits } from "@/hooks/useAICredits";

interface EditScriptDialogProps {
    script: {
        id: string;
        title: string;
        genre?: string;
        description?: string;
    };
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate: () => void;
}

const GENRES = [
    "Action", "Adventure", "Comedy", "Crime", "Drama", "Fantasy",
    "Historical", "Horror", "Mystery", "Romance", "Sci-Fi", "Thriller", "Western"
];

export function EditScriptDialog({ script, open, onOpenChange, onUpdate }: EditScriptDialogProps) {
    const { toast } = useToast();
    const [title, setTitle] = useState(script.title);
    const [genre, setGenre] = useState(script.genre || "");
    const [description, setDescription] = useState(script.description || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const { data: aiCredits, refetch: refetchCredits } = useAICredits();

    const handleGenerateAI = async () => {
        if (aiCredits !== undefined && aiCredits < 2) {
            toast({
                title: "Insufficient Credits",
                description: "You need at least 2 AI credits to auto-generate a description.",
                variant: "destructive"
            });
            return;
        }

        setIsGenerating(true);
        try {
            // 1. Fetch script content snippet
            const { data: scriptElements, error: fetchError } = await supabase
                .from('script_elements')
                .select('content, type')
                .eq('script_id', script.id)
                .order('position', { ascending: true })
                .limit(50); // Fetch first 50 elements to get context

            if (fetchError) throw fetchError;

            if (!scriptElements || scriptElements.length === 0) {
                toast({
                    title: "No Content",
                    description: "Script is empty. Add content to generate a description.",
                    variant: "destructive"
                });
                return;
            }

            // Format content for AI
            const contentSnippet = scriptElements
                .map(el => el.content)
                .join("\n")
                .substring(0, 3000); // Limit to ~3000 chars

            // 2. Call AI Edge Function
            const { data: aiData, error: aiError } = await supabase.functions.invoke('generate-script-content', {
                body: {
                    promptOverride: `Generate a compelling, single-sentence logline (description) for this movie script. It should be concise (under 50 words) and intriguing. \n\nScript Snippet:\n${contentSnippet}`,
                    customSystemPrompt: "You are a professional script consultant specializing in writing enticing loglines.",
                    scriptId: script.id,
                    active_ai_provider: 'deepseek' // or use default
                }
            });

            if (aiError) throw aiError;
            if (!aiData.success) throw new Error(aiData.error || "AI generation failed");

            // Deduct credits after successful generation
            const creditResult = await deductAICredits(2, "Generate Script Logline", `Auto-generated logline for script ${script.id}`);
            if (creditResult.success) {
                refetchCredits();
            }

            // 3. Update state
            setDescription(aiData.content.replace(/^Logline:\s*/i, "").replace(/^"|"$/g, "").trim());

            toast({
                title: "Logline Generated",
                description: "AI has created a description based on your script.",
            });

        } catch (error: any) {
            console.error("AI Generation Error:", error);
            toast({
                title: "Generation Failed",
                description: error.message || "Could not generate description.",
                variant: "destructive"
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            toast({
                title: "Validation Error",
                description: "Script title cannot be empty",
                variant: "destructive"
            });
            return;
        }

        try {
            setIsSaving(true);
            const { error } = await supabase
                .from('scripts')
                .update({
                    title,
                    genre: genre || null,
                    description: description || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', script.id);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Script details updated successfully",
            });

            onUpdate();
            onOpenChange(false);
        } catch (error: any) {
            console.error("Error updating script:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to update script",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Script Details</DialogTitle>
                    <DialogDescription>
                        Update the basic information for your script.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">
                            Title
                        </Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="genre" className="text-right">
                            Genre
                        </Label>
                        <Select value={genre} onValueChange={setGenre}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select genre" />
                            </SelectTrigger>
                            <SelectContent>
                                {GENRES.map((g) => (
                                    <SelectItem key={g} value={g}>{g}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="description" className="text-right pt-2">
                            Logline
                        </Label>
                        <div className="col-span-3 space-y-2">
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="min-h-[100px]"
                                placeholder="A brief summary of your script..."
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleGenerateAI}
                                disabled={isGenerating}
                                className="w-full text-xs border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-3 w-3" />
                                        Auto-Generate with AI
                                        <div className="ml-2 flex items-center text-[10px] bg-purple-100 px-1.5 py-0.5 rounded-full text-purple-600">
                                            <Coins className="w-3 h-3 mr-1" />
                                            2
                                        </div>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving} className="bg-naija-green hover:bg-naija-green-dark">
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
