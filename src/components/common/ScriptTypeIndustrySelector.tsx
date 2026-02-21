import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScriptType, FilmIndustry } from "@/types";
import { getIndustryDisplayInfo } from "@/utils/filmIndustryContext";
import { Film, FileText, Video, ScrollText, ArrowLeft, Tv, Monitor, Music, Megaphone, Theater } from "lucide-react";

interface ScriptTypeIndustrySelectorProps {
    onSelect: (scriptType: ScriptType, filmIndustry: FilmIndustry) => void;
    onBack: () => void;
}

const scriptTypeIcons: Record<ScriptType, React.ReactNode> = {
    [ScriptType.SHORT_FILM]: <Video className="h-6 w-6" />,
    [ScriptType.FEATURE_FILM]: <Film className="h-6 w-6" />,
    [ScriptType.SKIT]: <FileText className="h-6 w-6" />,
    [ScriptType.DOCUMENTARY]: <ScrollText className="h-6 w-6" />,
    [ScriptType.TV_PILOT]: <Tv className="h-6 w-6" />,
    [ScriptType.TV_SERIES]: <Tv className="h-6 w-6" />,
    [ScriptType.WEB_SERIES]: <Monitor className="h-6 w-6" />,
    [ScriptType.MUSIC_VIDEO]: <Music className="h-6 w-6" />,
    [ScriptType.COMMERCIAL]: <Megaphone className="h-6 w-6" />,
    [ScriptType.STAGE_PLAY]: <Theater className="h-6 w-6" />
};

const scriptTypeDescriptions: Record<ScriptType, string> = {
    [ScriptType.SHORT_FILM]: "Short narrative film (under 40 minutes)",
    [ScriptType.FEATURE_FILM]: "Full-length feature film (90+ minutes)",
    [ScriptType.SKIT]: "Short, punchy sketch (30s-5min) with clear setup and payoff",
    [ScriptType.DOCUMENTARY]: "Non-fiction documentary project",
    [ScriptType.TV_PILOT]: "First episode of a TV series",
    [ScriptType.TV_SERIES]: "Episode of an ongoing TV series",
    [ScriptType.WEB_SERIES]: "Online episodic content",
    [ScriptType.MUSIC_VIDEO]: "Visual narrative for music",
    [ScriptType.COMMERCIAL]: "Advertisement or promotional video",
    [ScriptType.STAGE_PLAY]: "Live theatrical performance"
};

export const ScriptTypeIndustrySelector: React.FC<ScriptTypeIndustrySelectorProps> = ({ onSelect, onBack }) => {
    const [selectedType, setSelectedType] = React.useState<ScriptType | null>(null);
    const [selectedIndustry, setSelectedIndustry] = React.useState<FilmIndustry | null>(null);

    const handleContinue = () => {
        if (selectedType && selectedIndustry) {
            onSelect(selectedType, selectedIndustry);
        }
    };

    const canContinue = selectedType && selectedIndustry;

    return (
        <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto pr-2">
            {/* Script Type Selection */}
            <div>
                <Label className="text-lg font-semibold mb-4 block">Script Type</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.values(ScriptType).map((type) => (
                        <Card
                            key={type}
                            className={`cursor-pointer transition-all hover:shadow-md ${selectedType === type
                                ? 'border-naija-green border-2 bg-naija-green/5'
                                : 'border-border hover:border-naija-green/50'
                                }`}
                            onClick={() => setSelectedType(type)}
                        >
                            <CardContent className="pt-4 pb-3 px-3 text-center">
                                <div className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-2 ${selectedType === type ? 'bg-naija-green text-white' : 'bg-muted text-muted-foreground'
                                    }`}>
                                    {scriptTypeIcons[type]}
                                </div>
                                <h3 className="font-semibold text-xs mb-1">{type}</h3>
                                <p className="text-[10px] text-muted-foreground leading-tight">{scriptTypeDescriptions[type]}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Film Industry Selection */}
            <div>
                <Label htmlFor="industry" className="text-lg font-semibold mb-4 block">Film Industry Style</Label>
                <Select
                    value={selectedIndustry || undefined}
                    onValueChange={(value) => setSelectedIndustry(value as FilmIndustry)}
                >
                    <SelectTrigger id="industry" className="w-full">
                        <SelectValue placeholder="Select film industry style..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                        {Object.values(FilmIndustry).map((industry) => {
                            const info = getIndustryDisplayInfo(industry);
                            return (
                                <SelectItem key={industry} value={industry}>
                                    <span className="flex items-center gap-2">
                                        <span>{info.emoji}</span>
                                        <span>{info.name}</span>
                                    </span>
                                </SelectItem>
                            );
                        })}
                    </SelectContent>
                </Select>

                {selectedIndustry && (
                    <Card className="mt-4 bg-muted/50">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                {getIndustryDisplayInfo(selectedIndustry).emoji}
                                {getIndustryDisplayInfo(selectedIndustry).name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription className="text-xs">
                                {getIndustryDisplayInfo(selectedIndustry).description}
                            </CardDescription>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={onBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <Button
                    onClick={handleContinue}
                    disabled={!canContinue}
                    className="bg-naija-green hover:bg-naija-green/90 text-white"
                >
                    Continue
                </Button>
            </div>
        </div>
    );
};
