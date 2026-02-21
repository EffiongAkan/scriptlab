import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Link, Eye, Edit, Trash2, Users, Calendar, Shield, Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ScriptSharingService, ShareOptions } from '@/services/script-sharing-service';

interface ShareLink {
  id: string;
  share_token: string;
  access_level: 'read' | 'comment' | 'edit';
  expires_at?: string;
  allow_download: boolean;
  share_type: string;
  created_at: string;
  updated_at: string;
  access_count: number;
}

interface ShareLinkManagerProps {
  scriptId: string;
  scriptTitle: string;
}

export const ShareLinkManager: React.FC<ShareLinkManagerProps> = ({
  scriptId,
  scriptTitle
}) => {
  const { toast } = useToast();
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [loading, setLoading] = useState(true);

  const [isCreating, setIsCreating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newLink, setNewLink] = useState({
    permissions: 'read' as 'read' | 'comment' | 'edit',
    isPasswordProtected: false,
    password: '',
    expiresAt: '',
    allowDownload: false
  });

  useEffect(() => {
    loadActiveShares();
  }, [scriptId]);

  const loadActiveShares = async () => {
    try {
      const shares = await ScriptSharingService.getActiveShares(scriptId);
      setShareLinks(shares);
    } catch (error) {
      console.error('Error loading shares:', error);
      toast({
        title: "Error",
        description: "Failed to load existing share links",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLink = async () => {
    setCreating(true);
    try {
      const options: ShareOptions = {
        type: 'link',
        accessLevel: newLink.permissions,
        expiresAt: newLink.expiresAt ? new Date(newLink.expiresAt) : undefined,
        password: newLink.isPasswordProtected ? newLink.password : undefined,
        allowDownload: newLink.allowDownload
      };

      const result = await ScriptSharingService.createShareLink(scriptId, options);
      
      if (result.success) {
        await loadActiveShares(); // Refresh the list
        setIsCreating(false);
        setNewLink({
          permissions: 'read',
          isPasswordProtected: false,
          password: '',
          expiresAt: '',
          allowDownload: false
        });

        toast({
          title: "Share Link Created",
          description: "Your share link has been created successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create share link",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating share link:', error);
      toast({
        title: "Error",
        description: "Failed to create share link",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = async (shareToken: string) => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/share/${shareToken}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link Copied",
        description: "Share link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLink = async (shareToken: string) => {
    try {
      const success = await ScriptSharingService.revokeShareLink(shareToken);
      if (success) {
        await loadActiveShares(); // Refresh the list
        toast({
          title: "Link Deleted",
          description: "Share link has been deleted",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete share link",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting share link:', error);
      toast({
        title: "Error",
        description: "Failed to delete share link",
        variant: "destructive",
      });
    }
  };

  const getPermissionColor = (accessLevel: string) => {
    switch (accessLevel) {
      case 'read': return 'bg-blue-100 text-blue-800';
      case 'comment': return 'bg-yellow-100 text-yellow-800';
      case 'edit': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPermissionIcon = (accessLevel: string) => {
    switch (accessLevel) {
      case 'read': return <Eye className="h-3 w-3" />;
      case 'comment': return <Users className="h-3 w-3" />;
      case 'edit': return <Edit className="h-3 w-3" />;
      default: return <Eye className="h-3 w-3" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading share links...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create New Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Share Links
            </div>
            <Button
              size="sm"
              onClick={() => setIsCreating(!isCreating)}
            >
              {isCreating ? 'Cancel' : 'Create Link'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isCreating && (
            <div className="space-y-4 border rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Permissions</label>
                  <Select
                    value={newLink.permissions}
                    onValueChange={(value: 'read' | 'comment' | 'edit') => 
                      setNewLink({ ...newLink, permissions: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="read">View Only</SelectItem>
                      <SelectItem value="comment">View & Comment</SelectItem>
                      <SelectItem value="edit">View & Edit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Expires On</label>
                  <Input
                    type="date"
                    value={newLink.expiresAt}
                    onChange={(e) => setNewLink({ ...newLink, expiresAt: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Allow Download</label>
                  <Switch
                    checked={newLink.allowDownload}
                    onCheckedChange={(checked) => 
                      setNewLink({ ...newLink, allowDownload: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Password Protection</label>
                  <Switch
                    checked={newLink.isPasswordProtected}
                    onCheckedChange={(checked) => 
                      setNewLink({ ...newLink, isPasswordProtected: checked })
                    }
                  />
                </div>
                {newLink.isPasswordProtected && (
                  <Input
                    type="password"
                    placeholder="Enter password..."
                    value={newLink.password}
                    onChange={(e) => setNewLink({ ...newLink, password: e.target.value })}
                  />
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateLink} disabled={creating}>
                  {creating ? <Loader className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Link
                </Button>
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Existing Links */}
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {shareLinks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Link className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No share links created yet</p>
                  <p className="text-sm">Create your first share link to collaborate</p>
                </div>
              ) : (
                shareLinks.map((link) => {
                  const baseUrl = window.location.origin;
                  const shareUrl = `${baseUrl}/share/${link.share_token}`;
                  
                  return (
                    <div key={link.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Share Link</span>
                          <Badge className={`text-xs ${getPermissionColor(link.access_level)}`}>
                            <div className="flex items-center gap-1">
                              {getPermissionIcon(link.access_level)}
                              {link.access_level.toUpperCase()}
                            </div>
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          {link.expires_at && (
                            <Calendar className="h-4 w-4 text-orange-600" />
                          )}
                          {link.allow_download && (
                            <div className="h-4 w-4 text-green-600 text-xs">↓</div>
                          )}
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground mb-3">
                        <div className="font-mono bg-gray-50 p-2 rounded text-xs break-all">
                          {shareUrl}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                        <span>Accessed {link.access_count} times</span>
                        <span>Created {formatDistanceToNow(new Date(link.created_at), { addSuffix: true })}</span>
                      </div>

                      {link.expires_at && (
                        <div className="text-xs text-orange-600 mb-3">
                          Expires {formatDistanceToNow(new Date(link.expires_at), { addSuffix: true })}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyLink(link.share_token)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteLink(link.share_token)}
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
