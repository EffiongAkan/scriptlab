
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, CheckCircle, AlertCircle, Info, BookOpen, MessageCircle } from 'lucide-react';
import { NigerianTerminologyService } from '@/services/nigerian-terminology';
import { validateCulturalAuthenticity } from '@/services/cultural-validation';

interface CulturalIssue {
  id: string;
  type: 'language' | 'tradition' | 'behavior' | 'reference' | 'terminology';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
  culturalContext: string;
  elementId: string;
}

interface CulturalValidatorProps {
  scriptId: string;
  elements: any[];
  onApplySuggestion: (elementId: string, content: string) => void;
  isGenerating: boolean;
  onGenerate: (prompt: string) => void;
}

export const CulturalValidator: React.FC<CulturalValidatorProps> = ({
  scriptId,
  elements,
  onApplySuggestion,
  isGenerating,
  onGenerate
}) => {
  const [selectedCulture, setSelectedCulture] = useState('nigerian');
  const [selectedRegion, setSelectedRegion] = useState('lagos');
  const [activeTab, setActiveTab] = useState('validation');
  const [issues, setIssues] = useState<CulturalIssue[]>([]);

  // Get script content for analysis
  const scriptContent = elements.map(el => el.content).join(' ');
  const culturalAnalysis = validateCulturalAuthenticity(scriptContent);

  const handleValidateCulture = () => {
    // Generate cultural issues based on analysis
    const newIssues: CulturalIssue[] = [];
    
    // Check terminology usage
    const dialogueElements = elements.filter(el => el.type === 'dialogue');
    dialogueElements.forEach((element, index) => {
      const validation = NigerianTerminologyService.validateCulturalContext(element.content);
      
      if (validation.score < 70) {
        newIssues.push({
          id: `terminology-${index}`,
          type: 'terminology',
          severity: validation.score < 40 ? 'high' : 'medium',
          description: 'Dialogue lacks cultural authenticity',
          suggestion: validation.suggestions[0] || 'Add Nigerian expressions for authenticity',
          culturalContext: 'Nigerian dialogue typically includes local expressions and respect terms',
          elementId: element.id || `element-${index}`
        });
      }
      
      validation.issues.forEach((issue, issueIndex) => {
        newIssues.push({
          id: `issue-${index}-${issueIndex}`,
          type: 'language',
          severity: 'high',
          description: issue,
          suggestion: 'Review and replace with culturally appropriate terms',
          culturalContext: 'Cultural sensitivity is important in Nigerian storytelling',
          elementId: element.id || `element-${index}`
        });
      });
    });

    // Add general cultural analysis issues
    if (culturalAnalysis.score < 60) {
      culturalAnalysis.suggestions.forEach((suggestion, index) => {
        newIssues.push({
          id: `general-${index}`,
          type: 'reference',
          severity: 'medium',
          description: 'Missing cultural context',
          suggestion,
          culturalContext: 'Nigerian scripts benefit from cultural authenticity',
          elementId: 'general'
        });
      });
    }

    setIssues(newIssues);
    onGenerate(`Validate cultural authenticity for ${selectedCulture} culture in ${selectedRegion} region`);
  };

  const getSeverityColor = (severity: CulturalIssue['severity']) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
    }
  };

  const getSeverityIcon = (severity: CulturalIssue['severity']) => {
    switch (severity) {
      case 'high': return <AlertCircle className="h-3 w-3" />;
      case 'medium': return <AlertCircle className="h-3 w-3" />;
      case 'low': return <Info className="h-3 w-3" />;
    }
  };

  const getTypeIcon = (type: CulturalIssue['type']) => {
    switch (type) {
      case 'language': return '🗣️';
      case 'tradition': return '🏛️';
      case 'behavior': return '👥';
      case 'reference': return '📖';
      case 'terminology': return '📚';
    }
  };

  // Get terminology for current region
  const terminology = NigerianTerminologyService.getTerminology('cultural', selectedRegion as any);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Enhanced Cultural Validator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="validation">Validation</TabsTrigger>
            <TabsTrigger value="terminology">Terminology</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
          </TabsList>

          <TabsContent value="validation" className="space-y-4 mt-4">
            {/* Cultural Settings */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">Cultural Context</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Culture</label>
                  <Select value={selectedCulture} onValueChange={setSelectedCulture}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nigerian">Nigerian</SelectItem>
                      <SelectItem value="yoruba">Yoruba Specific</SelectItem>
                      <SelectItem value="igbo">Igbo Specific</SelectItem>
                      <SelectItem value="hausa">Hausa Specific</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Region</label>
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lagos">Lagos</SelectItem>
                      <SelectItem value="abuja">Abuja</SelectItem>
                      <SelectItem value="kano">Kano</SelectItem>
                      <SelectItem value="port-harcourt">Port Harcourt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button
                onClick={handleValidateCulture}
                disabled={isGenerating}
                className="w-full mt-3"
              >
                <Globe className="h-4 w-4 mr-2" />
                Validate Cultural Authenticity
              </Button>
            </div>

            {/* Cultural Score */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Cultural Authenticity Score</span>
                <Badge variant={culturalAnalysis.score >= 70 ? "default" : culturalAnalysis.score >= 40 ? "secondary" : "destructive"}>
                  {culturalAnalysis.score}/100
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                {culturalAnalysis.enhancements.slice(0, 2).map((enhancement, i) => (
                  <p key={i}>• {enhancement}</p>
                ))}
              </div>
            </div>

            {/* Cultural Issues */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">Validation Results</h4>
                <Badge variant="outline">
                  {issues.length} issues found
                </Badge>
              </div>
              
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {issues.map((issue) => (
                    <div key={issue.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getTypeIcon(issue.type)}</span>
                          <Badge className={`text-xs ${getSeverityColor(issue.severity)} flex items-center gap-1`}>
                            {getSeverityIcon(issue.severity)}
                            {issue.severity.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <div className="text-sm font-medium text-red-700 mb-1">Issue:</div>
                          <div className="text-sm">{issue.description}</div>
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium text-green-700 mb-1">Suggestion:</div>
                          <div className="text-sm">{issue.suggestion}</div>
                        </div>
                        
                        <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                          <div className="text-xs font-medium text-blue-700 mb-1">Cultural Context:</div>
                          <div className="text-xs text-blue-600">{issue.culturalContext}</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          onClick={() => onApplySuggestion(issue.elementId, issue.suggestion)}
                        >
                          Apply Fix
                        </Button>
                        <Button variant="outline" size="sm">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Mark as Reviewed
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="terminology" className="space-y-4 mt-4">
            <div>
              <h4 className="font-medium mb-3">Nigerian Industry Terminology</h4>
              <ScrollArea className="h-80">
                <div className="space-y-3">
                  {terminology.map((term, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">{term.term}</h5>
                        <Badge variant="outline">{term.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{term.definition}</p>
                      <div className="space-y-1">
                        <div className="text-xs font-medium">Examples:</div>
                        {term.examples.map((example, i) => (
                          <div key={i} className="text-xs italic">"{example}"</div>
                        ))}
                      </div>
                      {term.alternatives && (
                        <div className="mt-2">
                          <div className="text-xs font-medium">Alternatives:</div>
                          <div className="text-xs">{term.alternatives.join(', ')}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4 mt-4">
            <div>
              <h4 className="font-medium mb-3">Regional Dialogue Patterns</h4>
              <div className="space-y-3">
                {Object.entries(NigerianTerminologyService.getRegionalDialoguePatterns(selectedRegion as any)).map(([type, items]) => (
                  <div key={type} className="border rounded-lg p-3">
                    <h5 className="font-medium mb-2 capitalize">{type}</h5>
                    <div className="flex flex-wrap gap-2">
                      {items.map((item, index) => (
                        <Badge key={index} variant="outline" className="cursor-pointer" 
                               onClick={() => onApplySuggestion('current', item)}>
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
