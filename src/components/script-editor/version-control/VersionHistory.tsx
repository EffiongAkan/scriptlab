
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { History, Download, GitCommit, User, Clock, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useVersionControl } from '@/hooks/useVersionControl';

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
  const { versions, fetchVersions, isLoading } = useVersionControl(scriptId);
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);

  useEffect(() => {
    if (scriptId) {
      fetchVersions();
    }
  }, [scriptId, fetchVersions]);

  const handleVersionToggle = (versionId: string) => {
    const newSelection = selectedVersions.includes(versionId)
      ? selectedVersions.filter(id => id !== versionId)
      : [...selectedVersions, versionId].slice(-2); // Max 2 versions for comparison

    setSelectedVersions(newSelection);
    onVersionSelect(newSelection);
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
                className={`p-4 border rounded-lg transition-colors ${selectedVersions.includes(version.id)
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50'
                  }`}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedVersions.includes(version.id)}
                    onCheckedChange={() => handleVersionToggle(version.id)}
                    disabled={selectedVersions.length >= 2 && !selectedVersions.includes(version.id)}
                  />

                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {version.author?.name ? version.author.name.charAt(0) : '?'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">v{version.version_number}</span>
                      <Badge variant="outline" className="text-xs">
                        {version.branch || 'main'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{version.author?.name || 'Unknown'}</span>
                      <Clock className="h-3 w-3 ml-2" />
                      <span>{formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <MessageSquare className="h-3 w-3 mt-0.5 text-muted-foreground" />
                      <p className="text-sm">{version.commit_message}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onVersionRestore(version.id)}
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
