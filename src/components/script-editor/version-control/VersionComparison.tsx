
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GitMerge, Plus, Minus, RotateCcw } from 'lucide-react';

interface ComparisonData {
  leftVersion: string;
  rightVersion: string;
  changes: {
    type: 'added' | 'removed' | 'modified';
    element: string;
    leftContent?: string;
    rightContent?: string;
    lineNumber: number;
  }[];
}

interface VersionComparisonProps {
  scriptId: string;
  selectedVersions: string[];
}

export const VersionComparison: React.FC<VersionComparisonProps> = ({
  scriptId,
  selectedVersions
}) => {
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);

  useEffect(() => {
    if (selectedVersions.length === 2) {
      // Mock comparison data
      const mockComparison: ComparisonData = {
        leftVersion: selectedVersions[0],
        rightVersion: selectedVersions[1],
        changes: [
          {
            type: 'modified',
            element: 'dialogue',
            leftContent: 'JOHN: I think we should leave now.',
            rightContent: 'JOHN: I think we should leave immediately!',
            lineNumber: 45
          },
          {
            type: 'added',
            element: 'action',
            rightContent: 'Thunder crashes outside, illuminating the room in brief, stark flashes.',
            lineNumber: 52
          },
          {
            type: 'removed',
            element: 'dialogue',
            leftContent: 'MARY: Are you sure about this?',
            lineNumber: 58
          },
          {
            type: 'modified',
            element: 'heading',
            leftContent: 'EXT. HOUSE - NIGHT',
            rightContent: 'EXT. ABANDONED HOUSE - STORMY NIGHT',
            lineNumber: 62
          }
        ]
      };
      
      setComparisonData(mockComparison);
    } else {
      setComparisonData(null);
    }
  }, [selectedVersions, scriptId]);

  const getChangeIcon = (type: ComparisonData['changes'][0]['type']) => {
    switch (type) {
      case 'added': return <Plus className="h-4 w-4 text-green-600" />;
      case 'removed': return <Minus className="h-4 w-4 text-red-600" />;
      case 'modified': return <RotateCcw className="h-4 w-4 text-blue-600" />;
    }
  };

  const getChangeBadgeColor = (type: ComparisonData['changes'][0]['type']) => {
    switch (type) {
      case 'added': return 'bg-green-100 text-green-800';
      case 'removed': return 'bg-red-100 text-red-800';
      case 'modified': return 'bg-blue-100 text-blue-800';
    }
  };

  if (selectedVersions.length < 2) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <GitMerge className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Select Two Versions to Compare</h3>
          <p className="text-muted-foreground">
            Go to the History tab and select exactly two versions to see their differences.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!comparisonData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading comparison...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitMerge className="h-5 w-5" />
          Version Comparison
        </CardTitle>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">v{comparisonData.leftVersion}</Badge>
            <span className="text-sm text-muted-foreground">vs</span>
            <Badge variant="outline">v{comparisonData.rightVersion}</Badge>
          </div>
          <Badge variant="secondary">
            {comparisonData.changes.length} changes
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {comparisonData.changes.map((change, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  {getChangeIcon(change.type)}
                  <Badge className={`text-xs ${getChangeBadgeColor(change.type)}`}>
                    {change.type.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Line {change.lineNumber} • {change.element}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {change.type === 'modified' && (
                    <>
                      <div className="p-2 bg-red-50 border border-red-200 rounded">
                        <div className="text-xs text-red-600 font-medium mb-1">
                          - v{comparisonData.leftVersion}
                        </div>
                        <div className="text-sm font-mono">{change.leftContent}</div>
                      </div>
                      <div className="p-2 bg-green-50 border border-green-200 rounded">
                        <div className="text-xs text-green-600 font-medium mb-1">
                          + v{comparisonData.rightVersion}
                        </div>
                        <div className="text-sm font-mono">{change.rightContent}</div>
                      </div>
                    </>
                  )}
                  
                  {change.type === 'added' && (
                    <div className="p-2 bg-green-50 border border-green-200 rounded">
                      <div className="text-xs text-green-600 font-medium mb-1">
                        + Added in v{comparisonData.rightVersion}
                      </div>
                      <div className="text-sm font-mono">{change.rightContent}</div>
                    </div>
                  )}
                  
                  {change.type === 'removed' && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded">
                      <div className="text-xs text-red-600 font-medium mb-1">
                        - Removed in v{comparisonData.rightVersion}
                      </div>
                      <div className="text-sm font-mono">{change.leftContent}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
