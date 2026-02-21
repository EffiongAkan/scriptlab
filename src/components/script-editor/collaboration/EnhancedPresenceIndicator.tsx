
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, Eye, Edit3, MessageCircle, Clock } from 'lucide-react';
import { useCollaboratorPresence } from '@/hooks/useCollaboratorPresence';
import { formatDistanceToNow } from 'date-fns';

interface EnhancedPresenceIndicatorProps {
  scriptId: string;
  currentUserId?: string;
}

interface CollaboratorActivity {
  userId: string;
  action: 'viewing' | 'editing' | 'commenting';
  elementId?: string;
  elementType?: string;
  timestamp: Date;
}

export const EnhancedPresenceIndicator: React.FC<EnhancedPresenceIndicatorProps> = ({
  scriptId,
  currentUserId
}) => {
  const { collaborators } = useCollaboratorPresence(scriptId, []);
  const [activities, setActivities] = useState<CollaboratorActivity[]>([]);
  const [showDetailedView, setShowDetailedView] = useState(false);

  // Simulate real-time activity updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newActivities: CollaboratorActivity[] = collaborators
        .filter(collab => collab.id !== currentUserId && collab.status === 'online')
        .map(collab => ({
          userId: collab.id,
          action: ['viewing', 'editing', 'commenting'][Math.floor(Math.random() * 3)] as any,
          elementId: `element-${Math.floor(Math.random() * 10) + 1}`,
          elementType: ['dialogue', 'action', 'heading'][Math.floor(Math.random() * 3)],
          timestamp: new Date(Date.now() - Math.random() * 30000)
        }));

      setActivities(newActivities);
    }, 5000);

    return () => clearInterval(interval);
  }, [collaborators, currentUserId]);

  const getActivityIcon = (action: CollaboratorActivity['action']) => {
    switch (action) {
      case 'viewing': return <Eye className="h-3 w-3" />;
      case 'editing': return <Edit3 className="h-3 w-3" />;
      case 'commenting': return <MessageCircle className="h-3 w-3" />;
      default: return <Users className="h-3 w-3" />;
    }
  };

  const getActivityColor = (action: CollaboratorActivity['action']) => {
    switch (action) {
      case 'viewing': return 'bg-blue-100 text-blue-800';
      case 'editing': return 'bg-green-100 text-green-800';
      case 'commenting': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const activeCollaborators = collaborators.filter(
    collab => collab.id !== currentUserId && collab.status === 'online'
  );

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Compact View */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {activeCollaborators.length} online
            </span>
          </div>

          {/* Avatar Stack */}
          <div className="flex -space-x-2">
            {activeCollaborators.slice(0, 3).map((collaborator) => (
              <Tooltip key={collaborator.id}>
                <TooltipTrigger>
                  <Avatar className="h-8 w-8 border-2 border-background">
                    <AvatarImage src={collaborator.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {(collaborator.username || 'A').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-sm">
                    <div className="font-medium">{collaborator.username || 'Anonymous'}</div>
                    <div className="text-muted-foreground">
                      Collaborator
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs">Active now</span>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
            {activeCollaborators.length > 3 && (
              <div className="h-8 w-8 border-2 border-background rounded-full bg-muted flex items-center justify-center">
                <span className="text-xs font-medium">
                  +{activeCollaborators.length - 3}
                </span>
              </div>
            )}
          </div>

          {activeCollaborators.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetailedView(!showDetailedView)}
              className="text-xs"
            >
              {showDetailedView ? 'Hide' : 'Details'}
            </Button>
          )}
        </div>

        {/* Detailed View */}
        {showDetailedView && activeCollaborators.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Live Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeCollaborators.map((collaborator) => {
                const activity = activities.find(a => a.userId === collaborator.id);
                
                return (
                  <div key={collaborator.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={collaborator.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {(collaborator.username || 'A').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {collaborator.username || 'Anonymous'}
                        </span>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                      
                      {activity && (
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getActivityColor(activity.action)}`}
                          >
                            {getActivityIcon(activity.action)}
                            <span className="ml-1 capitalize">{activity.action}</span>
                          </Badge>
                          
                          {activity.elementType && (
                            <span className="text-xs text-muted-foreground">
                              {activity.elementType}
                            </span>
                          )}
                          
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {activities.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Collaborators are connected but not actively editing
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {activeCollaborators.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>No other collaborators online</span>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};
