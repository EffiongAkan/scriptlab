
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GitBranch, History, GitMerge, Download, Upload } from 'lucide-react';
import { VersionHistory } from './VersionHistory';
import { BranchManager } from './BranchManager';
import { ConflictResolver } from './ConflictResolver';
import { VersionComparison } from './VersionComparison';
import { useToast } from '@/hooks/use-toast';

interface VersionControlPanelProps {
  scriptId: string;
  currentVersion?: string;
}

export const VersionControlPanel: React.FC<VersionControlPanelProps> = ({
  scriptId,
  currentVersion = '1.0.0'
}) => {
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [activeBranch, setActiveBranch] = useState('main');
  const [hasConflicts, setHasConflicts] = useState(false);
  const { toast } = useToast();

  const handleCreateBranch = (branchName: string) => {
    toast({
      title: "Branch Created",
      description: `Successfully created branch "${branchName}"`,
    });
  };

  const handleMergeBranch = (sourceBranch: string, targetBranch: string) => {
    // Simulate conflict detection
    const hasConflict = Math.random() > 0.7;
    
    if (hasConflict) {
      setHasConflicts(true);
      toast({
        title: "Merge Conflicts Detected",
        description: "Please resolve conflicts before merging",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Branch Merged",
        description: `Successfully merged "${sourceBranch}" into "${targetBranch}"`,
      });
    }
  };

  const handleVersionRestore = (versionId: string) => {
    toast({
      title: "Version Restored",
      description: `Successfully restored to version ${versionId}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Version Control</h3>
          <p className="text-sm text-muted-foreground">
            Track changes, create branches, and manage script versions
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <GitBranch className="h-3 w-3" />
            {activeBranch}
          </Badge>
          <Badge variant="secondary">v{currentVersion}</Badge>
        </div>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="branches" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Branches
          </TabsTrigger>
          <TabsTrigger value="compare" className="flex items-center gap-2">
            <GitMerge className="h-4 w-4" />
            Compare
          </TabsTrigger>
          <TabsTrigger value="conflicts" className="flex items-center gap-2">
            <GitMerge className="h-4 w-4" />
            Conflicts
            {hasConflicts && (
              <Badge variant="destructive" className="ml-1 text-xs">!</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-6">
          <VersionHistory
            scriptId={scriptId}
            onVersionSelect={setSelectedVersions}
            onVersionRestore={handleVersionRestore}
          />
        </TabsContent>

        <TabsContent value="branches" className="mt-6">
          <BranchManager
            scriptId={scriptId}
            activeBranch={activeBranch}
            onBranchChange={setActiveBranch}
            onCreateBranch={handleCreateBranch}
            onMergeBranch={handleMergeBranch}
          />
        </TabsContent>

        <TabsContent value="compare" className="mt-6">
          <VersionComparison
            scriptId={scriptId}
            selectedVersions={selectedVersions}
          />
        </TabsContent>

        <TabsContent value="conflicts" className="mt-6">
          <ConflictResolver
            scriptId={scriptId}
            hasConflicts={hasConflicts}
            onConflictsResolved={() => setHasConflicts(false)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
