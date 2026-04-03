import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Link as LinkIcon, CheckCircle, Video, Sparkles } from "lucide-react";
import { VideoAnalysis } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { deductAICredits } from "@/hooks/useAICredits";
interface VideoAnalysisDialogProps {
    onBack: () => void;
    onProceed: (analysis: VideoAnalysis) => void;
}

export const VideoAnalysisDialog: React.FC<VideoAnalysisDialogProps> = ({ onBack, onProceed }) => {
    const { toast } = useToast();
    const [videoUrl, setVideoUrl] = useState("");
    const [focusFilter, setFocusFilter] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
    const [activeTab, setActiveTab] = useState("new");
    const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
    const [isLoadingRecent, setIsLoadingRecent] = useState(false);

    const fetchRecentAnalyses = async () => {
        setIsLoadingRecent(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data, error } = await supabase
                .from('ai_cache' as any)
                .select('cache_key, response_content, created_at')
                .ilike('cache_key', 'video_analysis:%')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10);
                
            if (data && !error) {
                const parsed = (data as any[]).map(d => {
                    try { return { ...JSON.parse(d.response_content), cache_key: d.cache_key }; }
                    catch { return null; }
                }).filter(Boolean);
                setRecentAnalyses(parsed);
            }
        } catch (err) {
            console.error("Failed to fetch recent analyses", err);
        } finally {
            setIsLoadingRecent(false);
        }
    };

    React.useEffect(() => {
        if (activeTab === "recent" && recentAnalyses.length === 0) {
            fetchRecentAnalyses();
        }
    }, [activeTab]);

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
            const creditResult = await deductAICredits(5, 'video_analysis', `Analyzed video URL: ${trimmedUrl}`);
            if (!creditResult.success) {
                toast({
                    title: "Insufficient AI Credits",
                    description: creditResult.message || "You need 5 credits to analyze a video.",
                    variant: "destructive"
                });
                setIsAnalyzing(false);
                return;
            }

            console.log("[VideoAnalysis] Invoking edge function 'analyze-video'...");
            const { data, error } = await supabase.functions.invoke('analyze-video', {
                body: { videoUrl: trimmedUrl, forceRefresh, focusFilter: focusFilter === 'none' ? undefined : focusFilter }
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

                {/* 3-Act Structure (V2) or Fallback to V1 Story Structure */}
                {analysis.threeActBreakdown ? (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Three-Act Structure</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="border-l-2 border-primary/20 pl-4 space-y-4">
                                <div>
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Act I: Setup</h4>
                                    <p className="text-sm">{analysis.threeActBreakdown.setup}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-orange-500 uppercase tracking-wider mb-1">Inciting Incident</h4>
                                    <p className="text-sm">{analysis.threeActBreakdown.incitingIncident}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Act II: Confrontation</h4>
                                    <p className="text-sm">{analysis.threeActBreakdown.confrontation}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Act III: Resolution</h4>
                                    <p className="text-sm">{analysis.threeActBreakdown.resolution}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : analysis.storyStructure && (
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
                )}

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

    // Show URL input & Recent Analyses
    return (
        <div className="space-y-6 py-4">
            <div>
                <h3 className="text-lg font-semibold mb-2">Analyze Video</h3>
                <p className="text-sm text-muted-foreground">
                    Provide a video URL and we'll analyze its style, structure, and elements to help you create a similar script
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="new">New Analysis</TabsTrigger>
                    <TabsTrigger value="recent">Recent Analyses</TabsTrigger>
                </TabsList>

                <TabsContent value="new" className="space-y-4">
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

                    <div>
                        <Label htmlFor="focusFilter">Analytical Focus (Optional)</Label>
                        <Select value={focusFilter} onValueChange={setFocusFilter} disabled={isAnalyzing}>
                            <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Balanced Analysis (Default)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Balanced Analysis (Default)</SelectItem>
                                <SelectItem value="Plot twists, pacing, and narrative structure">Plot & Narrative Flow</SelectItem>
                                <SelectItem value="Character development, arcs, and dialogue patterns">Character & Dialogue</SelectItem>
                                <SelectItem value="Visual storytelling, tone, and environment">Cinematic & Visual Elements</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {isAnalyzing && (
                        <Card className="bg-muted/50">
                            <CardContent className="pt-6">
                                <div className="flex flex-col items-center text-center space-y-3">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <div>
                                        <h4 className="font-semibold">Analyzing Video...</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Extracting transcripts, story elements, and themes
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

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
                </TabsContent>

                <TabsContent value="recent" className="space-y-4">
                    {isLoadingRecent ? (
                        <div className="flex py-10 justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : recentAnalyses.length === 0 ? (
                        <div className="text-center py-10 border rounded-lg bg-muted/20">
                            <p className="text-sm text-muted-foreground">No recent analyses found.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 max-h-[50vh] overflow-y-auto pr-2">
                            {recentAnalyses.map((rec, i) => (
                                <Card key={i} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setAnalysis(rec as VideoAnalysis)}>
                                    <div className="flex p-3 gap-3">
                                        {rec.thumbnailUrl ? (
                                            <div className="w-20 shrink-0">
                                                <img src={rec.thumbnailUrl} alt={rec.videoTitle} className="w-full aspect-video object-cover rounded" />
                                            </div>
                                        ) : (
                                            <div className="w-20 shrink-0 aspect-video bg-muted rounded flex items-center justify-center">
                                                <Video className="h-6 w-6 text-muted-foreground/50" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-sm line-clamp-1">{rec.videoTitle || "Analyzed Video"}</h4>
                                            <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{rec.logline || rec.sourceUrl}</p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            <div className="flex justify-start pt-2">
                                <Button variant="outline" onClick={onBack}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back
                                </Button>
                            </div>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};
