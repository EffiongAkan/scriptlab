import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronUp, Sparkles, ListChecks } from "lucide-react";
import { tvSeriesStructures } from "@/utils/scriptTypeGuidance";
import { ScriptType, Genre } from "@/types";

export interface EpisodeIdea {
    episodeNumber: number;
    title: string;
    storyBeat: string;
}

export interface SeasonPlan {
    episodeCount: number;
    seasonTheme: string;
    episodes: EpisodeIdea[];
    title?: string;
    genre?: Genre;
}

interface SeasonPlanningSelectorProps {
    episodicStructure: string;
    scriptType?: ScriptType;
    onComplete: (plan: SeasonPlan) => void;
    onBack: () => void;
}

// Structure-specific defaults
const structureDefaults: Record<string, { episodeCount: number; suggestion: string }> = {
    EPISODIC: {
        episodeCount: 13,
        suggestion: "Each episode is standalone. Your season theme ties episodes together thematically rather than through a continuous plot."
    },
    SERIALIZED: {
        episodeCount: 8,
        suggestion: "One continuous story told across all episodes. Each episode is a chapter in your larger narrative."
    },
    HYBRID: {
        episodeCount: 10,
        suggestion: "Each episode has its own plot that resolves, while advancing a larger season arc."
    },
    ANTHOLOGY: {
        episodeCount: 8,
        suggestion: "Each episode is a completely new story. The season theme provides thematic unity across independent narratives."
    },
    LIMITED_SERIES: {
        episodeCount: 6,
        suggestion: "One complete story with a definitive beginning, middle, and end told across a fixed number of episodes."
    },
    SOAP: {
        episodeCount: 20,
        suggestion: "Ongoing story with multiple overlapping storylines. Season theme guides the overall narrative direction."
    },
    PROCEDURAL_WITH_ARC: {
        episodeCount: 13,
        suggestion: "Weekly cases that reset, with personal character arcs evolving across the season."
    }
};

export const SeasonPlanningSelector: React.FC<SeasonPlanningSelectorProps> = ({
    episodicStructure,
    scriptType,
    onComplete,
    onBack
}) => {
    const defaults = structureDefaults[episodicStructure] || structureDefaults.HYBRID;
    const structure = tvSeriesStructures[episodicStructure];
    const isWebSeries = scriptType === ScriptType.WEB_SERIES;

    // Adjust defaults for Web Series (usually shorter seasons)
    const initialEpisodeCount = isWebSeries ? Math.min(defaults.episodeCount, 10) : defaults.episodeCount;

    const [episodeCount, setEpisodeCount] = useState(initialEpisodeCount);
    const [seasonTheme, setSeasonTheme] = useState("");
    const [scriptTitle, setScriptTitle] = useState("");
    const [selectedGenre, setSelectedGenre] = useState<Genre | undefined>();
    const [planIndividualEpisodes, setPlanIndividualEpisodes] = useState(false);
    const [episodes, setEpisodes] = useState<EpisodeIdea[]>([]);
    const [expandedEpisode, setExpandedEpisode] = useState<number | null>(null);

    // Initialize episodes when count changes
    React.useEffect(() => {
        const newEpisodes: EpisodeIdea[] = [];
        for (let i = 1; i <= episodeCount; i++) {
            const existing = episodes.find(e => e.episodeNumber === i);
            newEpisodes.push(existing || {
                episodeNumber: i,
                title: i === 1 ? "Pilot" : "",
                storyBeat: ""
            });
        }
        setEpisodes(newEpisodes);
    }, [episodeCount]);

    const handleEpisodeChange = (episodeNumber: number, field: 'title' | 'storyBeat', value: string) => {
        setEpisodes(prev => prev.map(ep =>
            ep.episodeNumber === episodeNumber
                ? { ...ep, [field]: value }
                : ep
        ));
    };

    const handleContinue = () => {
        // Validate required fields
        if (!seasonTheme.trim()) return;

        // For Series, title and genre are required
        const needsTitleAndGenre = scriptType === ScriptType.TV_SERIES || scriptType === ScriptType.WEB_SERIES;
        if (needsTitleAndGenre && (!scriptTitle.trim() || !selectedGenre)) return;

        // Always create episode array based on episodeCount
        // If user manually planned episodes, use those; otherwise generate stubs
        const episodeArray = planIndividualEpisodes
            ? episodes
            : Array.from({ length: episodeCount }, (_, i) => ({
                episodeNumber: i + 1,
                title: i === 0 ? 'Pilot' : `Episode ${i + 1}`,
                storyBeat: seasonTheme  // Use season theme as the story beat
            }));

        onComplete({
            episodeCount,
            seasonTheme,
            episodes: episodeArray,
            title: needsTitleAndGenre ? scriptTitle : undefined,
            genre: needsTitleAndGenre ? selectedGenre : undefined
        });
    };

    const toggleEpisode = (episodeNumber: number) => {
        setExpandedEpisode(expandedEpisode === episodeNumber ? null : episodeNumber);
    };

    const needsTitleAndGenre = scriptType === ScriptType.TV_SERIES || scriptType === ScriptType.WEB_SERIES;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Season Planning</h3>
                <p className="text-sm text-muted-foreground">
                    Plan your {isWebSeries ? 'web series' : 'TV series'} season structure
                </p>
                {structure && (
                    <Badge variant="outline" className="mt-2">
                        {structure.name}
                    </Badge>
                )}
            </div>

            {/* Consolidated Title & Genre for Series */}
            {needsTitleAndGenre && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1 space-y-2">
                        <Label htmlFor="scriptTitle">Series Title</Label>
                        <Input
                            id="scriptTitle"
                            value={scriptTitle}
                            onChange={(e) => setScriptTitle(e.target.value)}
                            placeholder="Enter series title"
                        />
                    </div>
                    <div className="col-span-2 sm:col-span-1 space-y-2">
                        <Label htmlFor="genre">Genre</Label>
                        <Select value={selectedGenre} onValueChange={(value) => setSelectedGenre(value as Genre)}>
                            <SelectTrigger id="genre">
                                <SelectValue placeholder="Select genre" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="DRAMA">Drama</SelectItem>
                                <SelectItem value="COMEDY">Comedy</SelectItem>
                                <SelectItem value="ACTION">Action</SelectItem>
                                <SelectItem value="THRILLER">Thriller</SelectItem>
                                <SelectItem value="ROMANCE">Romance</SelectItem>
                                <SelectItem value="HORROR">Horror</SelectItem>
                                <SelectItem value="SCIFI">Sci-Fi</SelectItem>
                                <SelectItem value="FANTASY">Fantasy</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            {/* Episode Count */}
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <Label>Number of Episodes</Label>
                    <span className="text-2xl font-bold text-primary">{episodeCount}</span>
                </div>
                <Slider
                    value={[episodeCount]}
                    onValueChange={(value) => setEpisodeCount(value[0])}
                    min={1}
                    max={24}
                    step={1}
                    className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                    {episodeCount === 1 ? "Single episode" : `${episodeCount} episodes`}
                </p>
            </div>

            {/* Structure-specific suggestion */}
            {defaults.suggestion && (
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-4">
                        <div className="flex gap-2">
                            <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-foreground">
                                {defaults.suggestion}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Season Theme */}
            <div className="space-y-2">
                <Label htmlFor="seasonTheme">Season Theme / Story Idea *</Label>
                <Textarea
                    id="seasonTheme"
                    value={seasonTheme}
                    onChange={(e) => setSeasonTheme(e.target.value)}
                    placeholder={
                        episodicStructure === 'SERIALIZED'
                            ? "Describe the overall story arc across all episodes..."
                            : episodicStructure === 'EPISODIC'
                                ? "What thematic elements connect your episodes?..."
                                : "Describe the season's overarching theme or story arc..."
                    }
                    rows={3}
                    className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                    {episodicStructure === 'SERIALIZED'
                        ? "This is your main story told across the season"
                        : episodicStructure === 'EPISODIC'
                            ? "The unifying theme or setting that connects standalone episodes"
                            : "The larger narrative theme or story concept"
                    }
                </p>
            </div>

            {/* Individual Episode Planning (Optional) */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="planEpisodes"
                        checked={planIndividualEpisodes}
                        onChange={(e) => setPlanIndividualEpisodes(e.target.checked)}
                        className="rounded"
                    />
                    <Label htmlFor="planEpisodes" className="cursor-pointer">
                        Plan individual episodes (optional)
                    </Label>
                </div>

                {planIndividualEpisodes && (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                        {episodes.slice(0, Math.min(episodeCount, 6)).map(episode => (
                            <Card key={episode.episodeNumber} className="overflow-hidden">
                                <CardHeader
                                    className="py-3 px-4 cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => toggleEpisode(episode.episodeNumber)}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm">Episode {episode.episodeNumber}</span>
                                            {episode.title && (
                                                <span className="text-xs text-muted-foreground">- {episode.title}</span>
                                            )}
                                        </div>
                                        {expandedEpisode === episode.episodeNumber ? (
                                            <ChevronUp className="h-4 w-4" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4" />
                                        )}
                                    </div>
                                </CardHeader>
                                {expandedEpisode === episode.episodeNumber && (
                                    <CardContent className="space-y-3 pt-0 pb-4 px-4">
                                        <div>
                                            <Label className="text-xs">Episode Title</Label>
                                            <Input
                                                value={episode.title}
                                                onChange={(e) => handleEpisodeChange(episode.episodeNumber, 'title', e.target.value)}
                                                placeholder={episode.episodeNumber === 1 ? "Pilot" : `Episode ${episode.episodeNumber}`}
                                                className="text-sm"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Story Beat</Label>
                                            <Textarea
                                                value={episode.storyBeat}
                                                onChange={(e) => handleEpisodeChange(episode.episodeNumber, 'storyBeat', e.target.value)}
                                                placeholder={
                                                    episodicStructure === 'SERIALIZED'
                                                        ? "What happens in this chapter of the story?..."
                                                        : "What's the main conflict/case in this episode?..."
                                                }
                                                rows={2}
                                                className="text-sm resize-none"
                                            />
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        ))}
                        {episodeCount > 6 && (
                            <p className="text-xs text-center text-muted-foreground py-2">
                                <ListChecks className="h-3 w-3 inline mr-1" />
                                Showing first 6 episodes. {episodeCount - 6} more episodes will use the season theme.
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex justify-between gap-2 pt-4">
                <Button variant="outline" onClick={onBack}>
                    Back
                </Button>
                <Button
                    onClick={handleContinue}
                    disabled={!seasonTheme.trim()}
                    className="bg-primary"
                >
                    Continue
                </Button>
            </div>
        </div>
    );
};
