
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { GitBranch, Plus, GitMerge, Trash2, Users, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ScriptVersion } from '@/hooks/useVersionControl';

interface Branch {
  name: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  lastCommit: Date;
  commitsAhead: number;
  commitsBehind: number;
  isActive: boolean;
  isProtected?: boolean;
}

interface BranchManagerProps {
  scriptId: string;
  versions: ScriptVersion[];
  activeBranch: string;
  onBranchChange: (branch: string) => void;
  onCreateBranch: (branchName: string) => void;
  onMergeBranch: (sourceBranch: string, targetBranch: string) => void;
}

export const BranchManager: React.FC<BranchManagerProps> = ({
  scriptId,
  versions,
  activeBranch,
  onBranchChange,
  onCreateBranch,
  onMergeBranch
}) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [newBranchName, setNewBranchName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (!versions || versions.length === 0) {
      setBranches([{
        name: 'main',
        author: { id: 'system', name: 'System' },
        lastCommit: new Date(),
        commitsAhead: 0,
        commitsBehind: 0,
        isActive: activeBranch === 'main',
        isProtected: true
      }]);
      return;
    }

    const branchMap = new Map<string, Branch>();

    versions.forEach(v => {
      const branchName = v.branch || 'main';
      if (!branchMap.has(branchName)) {
        branchMap.set(branchName, {
          name: branchName,
          author: {
            id: v.created_by,
            name: v.author?.name || 'Unknown User',
            avatar: ''
          },
          lastCommit: new Date(v.created_at),
          commitsAhead: 0,
          commitsBehind: 0,
          isActive: branchName === activeBranch,
          isProtected: branchName === 'main'
        });
      }
    });

    // Ensure activeBranch exists in the list even if no commits yet (fallback)
    if (!branchMap.has(activeBranch)) {
      branchMap.set(activeBranch, {
        name: activeBranch,
        author: { id: 'current', name: 'You' },
        lastCommit: new Date(),
        commitsAhead: 0,
        commitsBehind: 0,
        isActive: true,
        isProtected: activeBranch === 'main'
      });
    }

    // Convert map to array and update active status
    const branchList = Array.from(branchMap.values()).map(b => ({
      ...b,
      isActive: b.name === activeBranch
    }));

    setBranches(branchList);
  }, [versions, activeBranch]);

  const handleCreateBranch = () => {
    if (!newBranchName.trim()) return;

    onCreateBranch(newBranchName);
    setNewBranchName('');
    setIsCreateDialogOpen(false);
  };

  const handleSwitchBranch = (branchName: string) => {
    onBranchChange(branchName);
  };

  const handleMergeBranch = (sourceBranch: string) => {
    onMergeBranch(sourceBranch, 'main');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Branch Management
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Branch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Branch</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Branch Name</label>
                  <Input
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    placeholder="feature/new-feature"
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateBranch} disabled={!newBranchName.trim()}>
                    Create Branch
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {branches.map((branch) => (
            <div
              key={branch.name}
              className={`p-4 border rounded-lg ${branch.isActive ? 'border-primary bg-primary/5' : 'border-border'
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={branch.author.avatar} />
                    <AvatarFallback>
                      {branch.author.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{branch.name}</span>
                      {branch.isActive && (
                        <Badge variant="default" className="text-xs">Active</Badge>
                      )}
                      {branch.isProtected && (
                        <Badge variant="secondary" className="text-xs">Protected</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {branch.author.name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(branch.lastCommit, { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {(branch.commitsAhead > 0 || branch.commitsBehind > 0) && (
                    <div className="flex items-center gap-1 text-xs">
                      {branch.commitsAhead > 0 && (
                        <Badge variant="outline" className="text-green-600">
                          +{branch.commitsAhead}
                        </Badge>
                      )}
                      {branch.commitsBehind > 0 && (
                        <Badge variant="outline" className="text-red-600">
                          -{branch.commitsBehind}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex gap-1">
                    {!branch.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSwitchBranch(branch.name)}
                      >
                        Switch
                      </Button>
                    )}

                    {branch.name !== 'main' && branch.commitsAhead > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMergeBranch(branch.name)}
                      >
                        <GitMerge className="h-3 w-3 mr-1" />
                        Merge
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
