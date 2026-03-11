
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
import { useVersionControl } from '@/hooks/useVersionControl';
import { useScriptContent } from '@/hooks/useScriptContent';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';

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

  // Save Version Dialog state
  const [isCommitDialogOpen, setIsCommitDialogOpen] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [versionPrefix, setVersionPrefix] = useState('1.0');

  const { toast } = useToast();

  const { elements, scriptData } = useScriptContent(scriptId);
  const { versions, fetchVersions, saveVersion, restoreVersion } = useVersionControl(scriptId);

  // Auto-increment version number roughly based on existing count
  const nextVersionNumber = `${versionPrefix}.${versions.length + 1}`;

  const handleCreateBranch = async (branchName: string) => {
    if (elements && scriptId) {
      const success = await saveVersion(
        elements,
        `Initial commit for branch ${branchName}`,
        nextVersionNumber,
        branchName
      );
      if (success) {
        setActiveBranch(branchName);
        toast({
          title: "Branch Created",
          description: `Successfully created and checked out branch "${branchName}"`,
        });
      }
    }
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

  const handleVersionRestore = async (versionId: string) => {
    const success = await restoreVersion(versionId);
    if (success) {
      window.location.reload(); // Quick refresh of context/editor data
    }
  };

  const handleSaveVersion = async () => {
    if (!commitMessage.trim()) {
      toast({ title: "Required", description: "Please enter a version message", variant: "destructive" });
      return;
    }

    if (elements && scriptId) {
      const success = await saveVersion(elements, commitMessage, nextVersionNumber, activeBranch);
      if (success) {
        setIsCommitDialogOpen(false);
        setCommitMessage('');
      }
    }
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
          {scriptId ? (
            <Dialog open={isCommitDialogOpen} onOpenChange={setIsCommitDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Version
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save New Version</DialogTitle>
                  <DialogDescription>
                    Store a snapshot of the current script. You can restore it anytime.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Version Number</Label>
                    <Input disabled value={`v${nextVersionNumber}`} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="message">Commit Message</Label>
                    <Input
                      id="message"
                      placeholder="e.g., Rewrote Act 2 Opening"
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCommitDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSaveVersion}>Save Commit</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : null}
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
            versions={versions}
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
