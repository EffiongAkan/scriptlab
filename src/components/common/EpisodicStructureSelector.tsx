import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Film, Tv, PlayCircle, ListChecks, Calendar, Drama, Sparkles } from "lucide-react";
import { ScriptType } from "@/types";
import { tvSeriesStructures } from "@/utils/scriptTypeGuidance";

interface EpisodicStructureSelectorProps {
    scriptType: ScriptType;
    onSelect: (structure: string) => void;
    onBack: () => void;
}

const structureIcons: Record<string, React.ReactNode> = {
    EPISODIC: <ListChecks className="h-6 w-6" />,
    SERIALIZED: <Film className="h-6 w-6" />,
    HYBRID: <PlayCircle className="h-6 w-6" />,
    ANTHOLOGY: <Sparkles className="h-6 w-6" />,
    LIMITED_SERIES: <Calendar className="h-6 w-6" />,
    SOAP: <Drama className="h-6 w-6" />,
    PROCEDURAL_WITH_ARC: <Tv className="h-6 w-6" />
};

export const EpisodicStructureSelector: React.FC<EpisodicStructureSelectorProps> = ({
    scriptType,
    onSelect,
    onBack
}) => {
    const [selectedStructure, setSelectedStructure] = React.useState<string | null>(null);

    const handleSelect = (structure: string) => {
        setSelectedStructure(structure);
    };

    const handleContinue = () => {
        if (selectedStructure) {
            onSelect(selectedStructure);
        }
    };

    // Only show episodic structures for TV series and Web series
    if (scriptType !== ScriptType.TV_SERIES && scriptType !== ScriptType.TV_PILOT && scriptType !== ScriptType.WEB_SERIES) {
        // For other script types, auto-select and continue
        React.useEffect(() => {
            onSelect('DEFAULT');
        }, [onSelect]);
        return null;
    }

    const isWebSeries = scriptType === ScriptType.WEB_SERIES;

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Choose Episodic Structure</h3>
                <p className="text-sm text-muted-foreground">
                    Select the storytelling format that best fits your {isWebSeries ? 'web series' : 'TV series'} vision
                </p>
            </div>

            <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2">
                {Object.entries(tvSeriesStructures).map(([key, structure]) => (
                    <Card
                        key={key}
                        className={`cursor-pointer transition-all hover:shadow-md ${selectedStructure === key ? 'ring-2 ring-primary bg-primary/5' : ''
                            }`}
                        onClick={() => handleSelect(key)}
                    >
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1 p-2 bg-primary/10 rounded-lg">
                                        {structureIcons[key]}
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-base mb-1">{structure.name}</CardTitle>
                                        <CardDescription className="text-xs">
                                            {structure.description}
                                        </CardDescription>
                                    </div>
                                </div>
                                {selectedStructure === key && (
                                    <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="space-y-2 text-xs">
                                <div>
                                    <span className="font-semibold">Plot Style:</span>{' '}
                                    <span className="text-muted-foreground">{structure.plotStyle}</span>
                                </div>
                                <div>
                                    <span className="font-semibold">Best For:</span>{' '}
                                    <span className="text-muted-foreground">{structure.bestFor}</span>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {structure.pros.slice(0, 2).map((pro, idx) => (
                                        <Badge key={idx} variant="secondary" className="text-[10px] px-1.5 py-0">
                                            ✓ {pro}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex justify-between gap-2 pt-4">
                <Button variant="outline" onClick={onBack}>
                    Back
                </Button>
                <Button
                    onClick={handleContinue}
                    disabled={!selectedStructure}
                    className="bg-primary"
                >
                    Continue
                </Button>
            </div>
        </div>
    );
};
