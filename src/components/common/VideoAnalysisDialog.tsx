import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Link as LinkIcon, CheckCircle, Video, Sparkles } from "lucide-react";
import { VideoAnalysis } from "@/types";
import { supabase } from "@/integrations/supabase/client";

interface VideoAnalysisDialogProps {
    onBack: () => void;
    onProceed: (analysis: VideoAnalysis) => void;
}

export const VideoAnalysisDialog: React.FC<VideoAnalysisDialogProps> = ({ onBack, onProceed }) => {
    const { toast } = useToast();
    const [videoUrl, setVideoUrl] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);

    const isValidUrl = (url: string): boolean => {
        try {
            const urlObj = new URL(url);
            // Support YouTube, Vimeo, and direct video URLs
            return (
                urlObj.hostname.includes('youtube.com') ||
                urlObj.hostname.includes('youtu.be') ||
                urlObj.hostname.includes('vimeo.com') ||
                url.match(/\.(mp4|webm|ogg|mov)$/i) !== null
            );
        } catch {
            return false;
        }
    };

    const handleAnalyze = async (forceRefresh = false) => {
        if (!videoUrl.trim()) {
            toast({
                title: "URL Required",
                description: "Please enter a video URL",
                variant: "destructive"
            });
            return;
        }

        if (!isValidUrl(videoUrl)) {
            toast({
                title: "Invalid URL",
                description: "Please enter a valid YouTube, Vimeo, or video file URL",
                variant: "destructive"
            });
            return;
        }

        setIsAnalyzing(true);
        const trimmedUrl = videoUrl.trim();
        console.log("[VideoAnalysis] Starting analysis for:", trimmedUrl, forceRefresh ? "(Forced)" : "");

        try {
            console.log("[VideoAnalysis] Invoking edge function 'analyze-video'...");
            const { data, error } = await supabase.functions.invoke('analyze-video', {
                body: { videoUrl: trimmedUrl, forceRefresh }
            });

            console.log("[VideoAnalysis] Function response received:", { data, error });

            if (error) {
                console.error("[VideoAnalysis] Edge function invocation error:", error);
                throw error;
            }

            if (!data?.success) {
                console.error("[VideoAnalysis] Analysis unsuccessful:", data?.error);
                throw new Error(data?.error || "Analysis failed");
            }

            // Detection for URL mismatch
            if (data.requestedUrl && !trimmedUrl.includes(data.requestedUrl.split('=').pop() || '')) {
                console.warn("[VideoAnalysis] URL Mismatch detected!", { requested: data.requestedUrl, input: trimmedUrl });
            }

            const videoAnalysis = data.analysis as VideoAnalysis;
            console.log("[VideoAnalysis] Parsed analysis data:", videoAnalysis);
            setAnalysis(videoAnalysis);

            toast({
                title: "Analysis Complete",
                description: videoAnalysis.metadataStatus === 'fallback'
                    ? "Video analyzed with generic data (deep metadata fetch failed)"
                    : "Video has been analyzed successfully",
                variant: "default"
            });

        } catch (error) {
            console.error("Error analyzing video:", error);
            toast({
                title: "Analysis Failed",
                description: error instanceof Error ? error.message : "Failed to analyze video. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleGenerateSimilar = () => {
        if (analysis) {
            onProceed(analysis);
        }
    };

    const handleStartOver = () => {
        setAnalysis(null);
        setVideoUrl("");
    };

    if (analysis) {
        // Show analysis results
        return (
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2 text-left">
                <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Video Analysis Complete
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Review the analysis below and choose how to proceed
                    </p>
                </div>

                {/* Video Info with Thumbnail */}
                <Card className="overflow-hidden border-primary/20 bg-primary/5">
                    <div className="flex flex-col md:flex-row">
                        {analysis.thumbnailUrl && (
                            <div className="w-full md:w-1/3 aspect-video">
                                <img
                                    src={analysis.thumbnailUrl}
                                    alt={analysis.videoTitle}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                        <div className="flex-1 p-4">
                            <CardHeader className="p-0 pb-2">
                                <CardTitle className="text-base flex items-center gap-2 line-clamp-2">
                                    <Video className="h-4 w-4 shrink-0" />
                                    {analysis.videoTitle || "Video"}
                                </CardTitle>
                                <CardDescription className="text-[10px] break-all line-clamp-1 opacity-70">
                                    {analysis.sourceUrl}
                                </CardDescription>
                            </CardHeader>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {analysis.isCached && (
                                    <Badge variant="outline" className="text-[10px] h-4 bg-background/50 border-muted">
                                        Cached
                                    </Badge>
                                )}
                                {analysis.metadataStatus === 'fallback' ? (
                                    <Badge variant="destructive" className="text-[10px] h-4 bg-orange-500/10 text-orange-600 border-orange-200">
                                        Generic Analysis- AI Guessed
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary" className="text-[10px] h-4 bg-green-500/10 text-green-700 border-green-200">
                                        Verified Metadata
                                    </Badge>
                                )}
                                <Button
                                    variant="link"
                                    className="h-4 text-[10px] p-0 text-muted-foreground hover:text-primary"
                                    onClick={() => handleAnalyze(true)}
                                    disabled={isAnalyzing}
                                >
                                    {isAnalyzing ? "Re-analyzing..." : "Not your video? Re-analyze"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Story Overview */}
                {(analysis.logline || analysis.synopsis) && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Story Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {analysis.logline && (
                                <div>
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Logline</h4>
                                    <p className="text-sm leading-relaxed italic border-l-2 border-primary/20 pl-3">
                                        "{analysis.logline}"
                                    </p>
                                </div>
                            )}
                            {analysis.synopsis && (
                                <div>
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Synopsis</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {analysis.synopsis}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Key Key Characters */}
                {analysis.keyCharacters && analysis.keyCharacters.length > 0 && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Key Characters</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {analysis.keyCharacters.map((char, idx) => (
                                <div key={idx} className="flex flex-col gap-1 p-3 rounded-md bg-muted/30 border border-border/50">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-sm">{char.name}</span>
                                        <Badge variant="outline" className="text-[10px] h-5">{char.role}</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{char.description}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Key Insights */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Key Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                            {analysis.keyInsights}
                        </p>
                    </CardContent>
                </Card>

                {/* Detected Elements */}
                <div className="grid grid-cols-2 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground">Genre</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Badge>{analysis.extractedGenre}</Badge>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground">Tone</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Badge variant="secondary" className="whitespace-normal text-center leading-tight h-auto py-1">{analysis.detectedTone}</Badge>
                        </CardContent>
                    </Card>
                </div>

                {/* Themes */}
                {analysis.themes.length > 0 && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Themes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {analysis.themes.map((theme, idx) => (
                                    <Badge key={idx} variant="outline" className="whitespace-normal text-center h-auto py-1">{theme}</Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Story Structure */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Story Structure</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                            {analysis.storyStructure}
                        </p>
                    </CardContent>
                </Card>

                {/* Character Types */}
                {analysis.characterTypes.length > 0 && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Character Types</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {analysis.characterTypes.map((char, idx) => (
                                    <Badge key={idx} variant="secondary" className="whitespace-normal text-center h-auto py-1">{char}</Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                <div className="flex justify-between gap-2 pt-4 sticky bottom-0 bg-background pb-2">
                    <Button variant="outline" onClick={handleStartOver}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Start Over
                    </Button>
                    <Button onClick={handleGenerateSimilar} className="bg-naija-green hover:bg-naija-green/90">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Similar Script
                    </Button>
                </div>
            </div>
        );
    }

    // Show URL input
    return (
        <div className="space-y-6 py-4">
            <div>
                <h3 className="text-lg font-semibold mb-2">Analyze Video</h3>
                <p className="text-sm text-muted-foreground">
                    Provide a video URL and we'll analyze its style, structure, and elements to help you create a similar script
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <Label htmlFor="videoUrl">Video URL</Label>
                    <div className="flex gap-2 mt-2">
                        <div className="relative flex-1">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="videoUrl"
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                placeholder="https://youtube.com/watch?v=..."
                                className="pl-9"
                                disabled={isAnalyzing}
                            />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Supported: YouTube, Vimeo, direct video links (.mp4, .webm)
                    </p>
                </div>

                {isAnalyzing && (
                    <Card className="bg-muted/50">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center space-y-3">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <div>
                                    <h4 className="font-semibold">Analyzing Video...</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Extracting story elements, themes, and style
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={onBack} disabled={isAnalyzing}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <Button onClick={() => handleAnalyze()} disabled={isAnalyzing || !videoUrl.trim()}>
                    {isAnalyzing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Analyze Video
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
};
