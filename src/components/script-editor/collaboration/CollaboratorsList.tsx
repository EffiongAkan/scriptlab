
import React from 'react';
import { User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Collaborator } from '@/types/collaboration';

interface CollaboratorsListProps {
  collaborators: Collaborator[];
}

export const CollaboratorsList = ({ collaborators }: CollaboratorsListProps) => {
  return (
    <div className="space-y-4">
      {collaborators.length > 0 ? (
        <div className="space-y-2">
          {collaborators.map((collaborator) => (
            <div key={collaborator.id} className="flex items-center justify-between p-2 rounded bg-gray-50">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{collaborator.username}</span>
              </div>
              <Badge variant={collaborator.status === 'online' ? 'default' : 'outline'}>
                {collaborator.status === 'online' ? 'Online' : 'Offline'}
              </Badge>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-4 text-muted-foreground text-sm">
          No collaborators yet. Invite someone to work on this script together!
        </div>
      )}
    </div>
  );
};
