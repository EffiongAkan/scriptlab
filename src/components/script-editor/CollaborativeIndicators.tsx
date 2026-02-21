
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Eye, Edit } from 'lucide-react';
import { useCollaboration } from '@/contexts/CollaborationContext';

interface CollaborativeIndicatorsProps {
  scriptId: string;
}

export const CollaborativeIndicators = ({ scriptId }: CollaborativeIndicatorsProps) => {
  const { collaborators } = useCollaboration();

  // Filter for active/online collaborators
  const activeCollaborators = collaborators.filter(collaborator => 
    collaborator.status === 'online'
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'editing':
        return <Edit className="h-3 w-3" />;
      case 'viewing':
        return <Eye className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'editing':
        return 'bg-green-500';
      case 'viewing':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (!activeCollaborators || activeCollaborators.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md border">
      <Users className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">
        {activeCollaborators.length} active
      </span>
      
      <div className="flex items-center gap-1 ml-2">
        {activeCollaborators.slice(0, 3).map((collaborator) => (
          <div key={collaborator.id} className="relative">
            <Avatar className="h-6 w-6 border-2 border-background">
              <AvatarImage src={collaborator.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {collaborator.full_name?.charAt(0) || collaborator.username?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div 
              className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background ${getStatusColor(collaborator.status)}`}
              title={`${collaborator.full_name || collaborator.username} is ${collaborator.status}`}
            >
              {getStatusIcon(collaborator.status)}
            </div>
          </div>
        ))}
        
        {activeCollaborators.length > 3 && (
          <Badge variant="secondary" className="h-6 text-xs">
            +{activeCollaborators.length - 3}
          </Badge>
        )}
      </div>
    </div>
  );
};
