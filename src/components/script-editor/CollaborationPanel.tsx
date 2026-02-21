
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CollaborativeWorkspace } from "./collaboration/CollaborativeWorkspace";
import { InvitationsList } from "./collaboration/InvitationsList";
import { InviteCollaboratorDialog } from "./collaboration/InviteCollaboratorDialog";
import { EnhancedPresenceIndicator } from "./collaboration/EnhancedPresenceIndicator";
import { ActivityFeed } from "./collaboration/ActivityFeed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, Mail, Activity } from "lucide-react";
import { useCollaboration } from "@/contexts/CollaborationContext";
import { validateInvitation } from "@/utils/invitationValidation";
import { useToast } from "@/hooks/use-toast";

interface CollaborationPanelProps {
  scriptId: string;
}

export const CollaborationPanel = ({ scriptId }: CollaborationPanelProps) => {
  const [newEmail, setNewEmail] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  // Get current user ID
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  const {
    collaborators,
    invitations,
    pendingInvitations,
    isLoading,
    inviteCollaborator,
    acceptInvitation,
    rejectInvitation
  } = useCollaboration();

  const handleInviteCollaborator = async (role?: string) => {
    if (!newEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    const validation = validateInvitation(scriptId, newEmail);
    if (!validation.isValid) {
      toast({
        title: "Invalid input",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    try {
      await inviteCollaborator(newEmail, scriptId, role || 'editor');
      setNewEmail("");
      toast({
        title: "Invitation sent",
        description: `Invitation sent to ${newEmail} as ${role || 'editor'}`,
      });
    } catch (error) {
      console.error('Error inviting collaborator:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      await acceptInvitation(invitationId);
      toast({
        title: "Invitation accepted",
        description: "You now have access to this script",
      });
    } catch (error) {
      toast({
        title: "Failed to accept invitation",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    try {
      await rejectInvitation(invitationId);
      toast({
        title: "Invitation rejected",
        description: "The invitation has been declined",
      });
    } catch (error) {
      toast({
        title: "Failed to reject invitation",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Collaborative Writing</h3>
        <p className="text-muted-foreground mb-6">
          Work together in real-time with live cursors, comments, invitations, and presence indicators.
        </p>
      </div>

      <Tabs defaultValue="workspace" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="workspace" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Workspace
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Invitations
            {pendingInvitations.length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {pendingInvitations.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="presence" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Live Activity
          </TabsTrigger>
          <TabsTrigger value="invite" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Invite
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workspace" className="mt-6">
          <CollaborativeWorkspace
            scriptId={scriptId}
            currentUserId={currentUserId}
          />
        </TabsContent>

        <TabsContent value="invitations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Collaboration Invitations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InvitationsList
                pendingInvitations={pendingInvitations}
                invitations={invitations}
                onAccept={handleAcceptInvitation}
                onReject={handleRejectInvitation}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="presence" className="mt-6">
          <ActivityFeed scriptId={scriptId} />
        </TabsContent>

        <TabsContent value="invite" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Invite Collaborators
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleInviteCollaborator();
                      }
                    }}
                  />
                </div>

                <InviteCollaboratorDialog
                  newEmail={newEmail}
                  setNewEmail={setNewEmail}
                  onInvite={handleInviteCollaborator}
                />
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Current Collaborators</h4>
                {collaborators.length > 0 ? (
                  <div className="space-y-2">
                    {collaborators.map((collaborator) => (
                      <div key={collaborator.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${collaborator.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                            }`} />
                          <span className="text-sm">
                            {collaborator.username || collaborator.email}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground capitalize">
                          {collaborator.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No collaborators yet. Invite someone to get started!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
