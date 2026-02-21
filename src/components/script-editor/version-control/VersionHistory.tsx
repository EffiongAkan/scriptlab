
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { History, Download, GitCommit, User, Clock, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Version {
  id: string;
  version: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: Date;
  message: string;
  changes: {
    added: number;
    modified: number;
    deleted: number;
  };
  branch: string;
  isCurrent?: boolean;
}

interface VersionHistoryProps {
  scriptId: string;
  onVersionSelect: (versions: string[]) => void;
  onVersionRestore: (versionId: string) => void;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  scriptId,
  onVersionSelect,
  onVersionRestore
}) => {
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);

  useEffect(() => {
    // Mock version history data
    const mockVersions: Version[] = [
      {
        id: 'v1.2.3',
        version: '1.2.3',
        author: { id: '1', name: 'Sarah Chen', avatar: '/placeholder.svg' },
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        message: 'Enhanced dialogue in Scene 3, improved character development',
        changes: { added: 5, modified: 12, deleted: 2 },
        branch: 'main',
        isCurrent: true
      },
      {
        id: 'v1.2.2',
        version: '1.2.2',
        author: { id: '2', name: 'Mike Johnson' },
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        message: 'Fixed formatting issues and typos',
        changes: { added: 0, modified: 8, deleted: 1 },
        branch: 'main'
      },
      {
        id: 'v1.2.1',
        version: '1.2.1',
        author: { id: '3', name: 'Emma Wilson', avatar: '/placeholder.svg' },
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
        message: 'Added new action sequences to opening scene',
        changes: { added: 15, modified: 3, deleted: 0 },
        branch: 'feature/opening-scene'
      },
      {
        id: 'v1.2.0',
        version: '1.2.0',
        author: { id: '1', name: 'Sarah Chen', avatar: '/placeholder.svg' },
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
        message: 'Major revision: restructured Act 2, new subplot introduced',
        changes: { added: 45, modified: 28, deleted: 12 },
        branch: 'main'
      }
    ];

    setVersions(mockVersions);
  }, [scriptId]);

  const handleVersionToggle = (versionId: string) => {
    const newSelection = selectedVersions.includes(versionId)
      ? selectedVersions.filter(id => id !== versionId)
      : [...selectedVersions, versionId].slice(-2); // Max 2 versions for comparison

    setSelectedVersions(newSelection);
    onVersionSelect(newSelection);
  };

  const getChangesBadgeColor = (changes: Version['changes']) => {
    const total = changes.added + changes.modified + changes.deleted;
    if (total > 30) return 'destructive';
    if (total > 10) return 'default';
    return 'secondary';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Version History
          {selectedVersions.length > 0 && (
            <Badge variant="outline">
              {selectedVersions.length} selected
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {versions.map((version) => (
              <div
                key={version.id}
                className={`p-4 border rounded-lg transition-colors ${
                  selectedVersions.includes(version.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                } ${version.isCurrent ? 'ring-2 ring-primary' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedVersions.includes(version.id)}
                    onCheckedChange={() => handleVersionToggle(version.id)}
                    disabled={selectedVersions.length >= 2 && !selectedVersions.includes(version.id)}
                  />
                  
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={version.author.avatar} />
                    <AvatarFallback>
                      {version.author.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">v{version.version}</span>
                      {version.isCurrent && (
                        <Badge variant="default" className="text-xs">Current</Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {version.branch}
                      </Badge>
                      <Badge 
                        variant={getChangesBadgeColor(version.changes)}
                        className="text-xs"
                      >
                        +{version.changes.added} ~{version.changes.modified} -{version.changes.deleted}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{version.author.name}</span>
                      <Clock className="h-3 w-3 ml-2" />
                      <span>{formatDistanceToNow(version.timestamp, { addSuffix: true })}</span>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-3 w-3 mt-0.5 text-muted-foreground" />
                      <p className="text-sm">{version.message}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onVersionRestore(version.id)}
                        disabled={version.isCurrent}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Restore
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        {selectedVersions.length === 2 && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Two versions selected. Switch to the "Compare" tab to see differences.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
