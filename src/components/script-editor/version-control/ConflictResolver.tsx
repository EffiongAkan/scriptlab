
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Check, X, ArrowLeft, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Conflict {
  id: string;
  element: string;
  lineNumber: number;
  currentContent: string;
  incomingContent: string;
  currentBranch: string;
  incomingBranch: string;
  resolved?: boolean;
  resolution?: 'current' | 'incoming' | 'custom';
  customContent?: string;
}

interface ConflictResolverProps {
  scriptId: string;
  hasConflicts: boolean;
  onConflictsResolved: () => void;
}

export const ConflictResolver: React.FC<ConflictResolverProps> = ({
  scriptId,
  hasConflicts,
  onConflictsResolved
}) => {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (hasConflicts) {
      // Mock conflict data
      const mockConflicts: Conflict[] = [
        {
          id: 'conflict-1',
          element: 'dialogue',
          lineNumber: 45,
          currentContent: 'JOHN: We need to be careful about this decision.',
          incomingContent: 'JOHN: We must be extremely cautious about this choice.',
          currentBranch: 'main',
          incomingBranch: 'feature/character-development'
        },
        {
          id: 'conflict-2',
          element: 'action',
          lineNumber: 78,
          currentContent: 'The door creaks open slowly.',
          incomingContent: 'The ancient wooden door groans as it swings open, revealing darkness beyond.',
          currentBranch: 'main',
          incomingBranch: 'feature/opening-scene'
        }
      ];
      
      setConflicts(mockConflicts);
    } else {
      setConflicts([]);
    }
  }, [hasConflicts, scriptId]);

  const handleResolveConflict = (conflictId: string, resolution: 'current' | 'incoming') => {
    setConflicts(prev => prev.map(conflict => 
      conflict.id === conflictId 
        ? { ...conflict, resolved: true, resolution }
        : conflict
    ));
  };

  const handleResolveAll = () => {
    const unresolvedConflicts = conflicts.filter(c => !c.resolved);
    
    if (unresolvedConflicts.length > 0) {
      toast({
        title: "Unresolved Conflicts",
        description: `Please resolve all ${unresolvedConflicts.length} conflicts before proceeding.`,
        variant: "destructive"
      });
      return;
    }

    onConflictsResolved();
    toast({
      title: "Conflicts Resolved",
      description: "All merge conflicts have been successfully resolved."
    });
  };

  const resolvedCount = conflicts.filter(c => c.resolved).length;

  if (!hasConflicts || conflicts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Conflicts</h3>
          <p className="text-muted-foreground">
            All changes can be merged automatically. No manual intervention required.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Merge Conflicts
          <Badge variant="destructive">
            {conflicts.length - resolvedCount} unresolved
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Resolve conflicts between branches before merging can proceed.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Progress: {resolvedCount}/{conflicts.length} conflicts resolved
            </span>
            <div className="w-32 bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(resolvedCount / conflicts.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <ScrollArea className="h-96">
          <div className="space-y-6">
            {conflicts.map((conflict) => (
              <div
                key={conflict.id}
                className={`border rounded-lg p-4 ${
                  conflict.resolved ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      Line {conflict.lineNumber} • {conflict.element}
                    </span>
                    {conflict.resolved && (
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        <Check className="h-3 w-3 mr-1" />
                        Resolved
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Current Version */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ArrowLeft className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-600">
                        Current ({conflict.currentBranch})
                      </span>
                    </div>
                    <div className="p-3 bg-white border rounded font-mono text-sm">
                      {conflict.currentContent}
                    </div>
                    {!conflict.resolved && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolveConflict(conflict.id, 'current')}
                        className="w-full"
                      >
                        Use This Version
                      </Button>
                    )}
                  </div>

                  {/* Incoming Version */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">
                        Incoming ({conflict.incomingBranch})
                      </span>
                    </div>
                    <div className="p-3 bg-white border rounded font-mono text-sm">
                      {conflict.incomingContent}
                    </div>
                    {!conflict.resolved && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolveConflict(conflict.id, 'incoming')}
                        className="w-full"
                      >
                        Use This Version
                      </Button>
                    )}
                  </div>
                </div>

                {conflict.resolved && (
                  <div className="p-2 bg-green-100 border border-green-200 rounded">
                    <span className="text-sm text-green-700 font-medium">
                      Resolved: Using {conflict.resolution} version
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleResolveAll}
            disabled={resolvedCount < conflicts.length}
            className="min-w-[200px]"
          >
            <Check className="h-4 w-4 mr-2" />
            Complete Merge ({resolvedCount}/{conflicts.length})
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
