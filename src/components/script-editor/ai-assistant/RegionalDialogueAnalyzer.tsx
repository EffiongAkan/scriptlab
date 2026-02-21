
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, MessageCircle, TrendingUp, Users } from 'lucide-react';

interface DialoguePattern {
  id: string;
  region: string;
  pattern: string;
  frequency: number;
  example: string;
  confidence: number;
}

interface RegionalDialogueAnalyzerProps {
  scriptId: string;
  elements: any[];
  onApplyPattern: (elementId: string, pattern: string) => void;
}

export const RegionalDialogueAnalyzer: React.FC<RegionalDialogueAnalyzerProps> = ({
  scriptId,
  elements,
  onApplyPattern
}) => {
  const [selectedRegion, setSelectedRegion] = useState('lagos');
  const [analysisResults, setAnalysisResults] = useState<DialoguePattern[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const patterns: DialoguePattern[] = [
    {
      id: '1',
      region: 'Lagos',
      pattern: 'Code-switching (English-Yoruba)',
      frequency: 87,
      example: "Omo, this thing no easy o!",
      confidence: 92
    },
    {
      id: '2',
      region: 'Lagos',
      pattern: 'Pidgin English dominance',
      frequency: 76,
      example: "Wetin you dey talk? I no understand.",
      confidence: 88
    },
    {
      id: '3',
      region: 'Abuja',
      pattern: 'Formal English with local expressions',
      frequency: 64,
      example: "I am telling you, this matter is serious wallahi.",
      confidence: 85
    },
    {
      id: '4',
      region: 'Kano',
      pattern: 'Hausa-English code-mixing',
      frequency: 82,
      example: "Kai, this boy is very stubborn wallahi.",
      confidence: 90
    },
    {
      id: '5',
      region: 'Port Harcourt',
      pattern: 'Pidgin with Ijaw influence',
      frequency: 73,
      example: "You see am? Na so the thing be.",
      confidence: 86
    }
  ];

  const analyzeDialogue = () => {
    setIsAnalyzing(true);
    
    // Simulate analysis
    setTimeout(() => {
      const regionPatterns = patterns.filter(p => 
        p.region.toLowerCase() === selectedRegion.toLowerCase() || 
        selectedRegion === 'all'
      );
      setAnalysisResults(regionPatterns);
      setIsAnalyzing(false);
    }, 2000);
  };

  const getRegionInfo = (region: string) => {
    const info = {
      lagos: {
        languages: ['English', 'Yoruba', 'Pidgin'],
        characteristics: 'High code-switching, urban slang',
        population: 'Multi-ethnic, cosmopolitan'
      },
      abuja: {
        languages: ['English', 'Hausa', 'Various'],
        characteristics: 'Formal register, diplomatic tone',
        population: 'Government officials, diverse'
      },
      kano: {
        languages: ['Hausa', 'English', 'Arabic'],
        characteristics: 'Traditional greetings, respectful tone',
        population: 'Predominantly Hausa-Fulani'
      },
      'port-harcourt': {
        languages: ['English', 'Pidgin', 'Ijaw'],
        characteristics: 'Oil industry terminology, maritime refs',
        population: 'Mixed ethnic groups'
      }
    };
    return info[region as keyof typeof info] || info.lagos;
  };

  const regionInfo = getRegionInfo(selectedRegion);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Regional Dialogue Analyzer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Region Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Select Region</label>
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lagos">Lagos State</SelectItem>
                <SelectItem value="abuja">Federal Capital Territory (Abuja)</SelectItem>
                <SelectItem value="kano">Kano State</SelectItem>
                <SelectItem value="port-harcourt">Rivers State (Port Harcourt)</SelectItem>
                <SelectItem value="all">All Regions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Region Information */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <h5 className="font-medium mb-2">{selectedRegion.charAt(0).toUpperCase() + selectedRegion.slice(1)} Linguistic Profile</h5>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div>
                <span className="font-medium">Languages: </span>
                <span className="text-muted-foreground">{regionInfo.languages.join(', ')}</span>
              </div>
              <div>
                <span className="font-medium">Characteristics: </span>
                <span className="text-muted-foreground">{regionInfo.characteristics}</span>
              </div>
              <div>
                <span className="font-medium">Population: </span>
                <span className="text-muted-foreground">{regionInfo.population}</span>
              </div>
            </div>
          </div>

          {/* Analysis Button */}
          <Button
            onClick={analyzeDialogue}
            disabled={isAnalyzing}
            className="w-full"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            {isAnalyzing ? 'Analyzing Dialogue Patterns...' : 'Analyze Regional Patterns'}
          </Button>

          {/* Analysis Results */}
          {analysisResults.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Detected Patterns</h4>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {analysisResults.map((pattern) => (
                    <div key={pattern.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{pattern.region}</Badge>
                          <Badge className="bg-blue-100 text-blue-800">
                            {pattern.confidence}% confidence
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <TrendingUp className="h-3 w-3" />
                          {pattern.frequency}%
                        </div>
                      </div>
                      
                      <h5 className="font-medium text-sm mb-1">{pattern.pattern}</h5>
                      <p className="text-sm text-muted-foreground italic mb-2">
                        "{pattern.example}"
                      </p>
                      
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>Usage Frequency</span>
                          <span>{pattern.frequency}%</span>
                        </div>
                        <Progress value={pattern.frequency} className="h-1" />
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onApplyPattern('current', pattern.example)}
                        className="w-full"
                      >
                        Apply Pattern
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Quick Regional Phrases */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Common Regional Phrases</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="ghost" size="sm" className="justify-start text-xs">
                <Users className="h-3 w-3 mr-1" />
                Greetings
              </Button>
              <Button variant="ghost" size="sm" className="justify-start text-xs">
                <MessageCircle className="h-3 w-3 mr-1" />
                Expressions
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
