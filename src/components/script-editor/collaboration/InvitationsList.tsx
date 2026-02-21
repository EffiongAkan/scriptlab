
import React from 'react';
import { Check, X, Clock, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Invitation } from '@/types/collaboration';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface InvitationsListProps {
  pendingInvitations: Invitation[];
  invitations: Invitation[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  isLoading?: boolean;
}

export const InvitationsList = ({ 
  pendingInvitations, 
  invitations, 
  onAccept, 
  onReject,
  isLoading = false
}: InvitationsListProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3" />;
      case 'accepted':
        return <Check className="h-3 w-3" />;
      case 'rejected':
        return <X className="h-3 w-3" />;
      default:
        return <Mail className="h-3 w-3" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <div className="space-y-2">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Mail className="h-4 w-4 text-yellow-600" />
            <h4 className="text-sm font-medium">Pending Invitations</h4>
            <Badge variant="secondary" className="text-xs">
              {pendingInvitations.length}
            </Badge>
          </div>
          
          <div className="space-y-3">
            {pendingInvitations.map((invitation) => (
              <Card key={invitation.id} className="border-l-4 border-l-yellow-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-yellow-100 text-yellow-700">
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate">
                            {invitation.inviterEmail}
                          </span>
                          <Badge className={`text-xs ${getStatusColor(invitation.status)}`}>
                            {getStatusIcon(invitation.status)}
                            <span className="ml-1 capitalize">{invitation.status}</span>
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-2">
                          has invited you to collaborate on this script
                        </p>
                        
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(invitation.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => onReject(invitation.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="mr-1 h-3 w-3" /> 
                        Decline
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => onAccept(invitation.id)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="mr-1 h-3 w-3" /> 
                        Accept
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Sent Invitations */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Mail className="h-4 w-4 text-blue-600" />
          <h4 className="text-sm font-medium">Sent Invitations</h4>
          <Badge variant="secondary" className="text-xs">
            {invitations.length}
          </Badge>
        </div>
        
        {invitations.length > 0 ? (
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <Card key={invitation.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate">
                            {invitation.inviteeEmail}
                          </span>
                          <Badge className={`text-xs ${getStatusColor(invitation.status)}`}>
                            {getStatusIcon(invitation.status)}
                            <span className="ml-1 capitalize">{invitation.status}</span>
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          Sent {formatDistanceToNow(new Date(invitation.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center">
              <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No invitations sent yet.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Use the "Invite" tab to send collaboration invitations.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Empty state when no invitations at all */}
      {pendingInvitations.length === 0 && invitations.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No invitations yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start collaborating by inviting team members to work on this script together.
            </p>
            <Button variant="outline" size="sm">
              <User className="mr-2 h-4 w-4" />
              Invite Your First Collaborator
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
