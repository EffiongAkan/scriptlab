import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, Edit3, MessageCircle, UserPlus, UserMinus, Activity as ActivityIcon, Clock } from 'lucide-react';
import { useScriptActivities } from '@/hooks/useScriptActivities';
import { formatDistanceToNow } from 'date-fns';

interface ActivityFeedProps {
    scriptId: string;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ scriptId }) => {
    const { activities, isLoading } = useScriptActivities(scriptId);

    const getActivityIcon = (action: string) => {
        switch (action) {
            case 'viewing': return <Eye className="h-3 w-3" />;
            case 'editing': return <Edit3 className="h-3 w-3" />;
            case 'commenting': return <MessageCircle className="h-3 w-3" />;
            case 'join': return <UserPlus className="h-3 w-3" />;
            case 'leave': return <UserMinus className="h-3 w-3" />;
            default: return <ActivityIcon className="h-3 w-3" />;
        }
    };

    const getActivityColor = (action: string) => {
        switch (action) {
            case 'viewing': return 'bg-blue-100 text-blue-800';
            case 'editing': return 'bg-green-100 text-green-800';
            case 'commenting': return 'bg-purple-100 text-purple-800';
            case 'join': return 'bg-emerald-100 text-emerald-800';
            case 'leave': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getActivityText = (activity: any) => {
        switch (activity.action_type) {
            case 'viewing': return 'is viewing the script';
            case 'editing': return 'edited the script';
            case 'commenting': return 'added a comment';
            case 'join': return 'joined the session';
            case 'leave': return 'left the session';
            default: return activity.action_type;
        }
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ActivityIcon className="h-5 w-5" />
                    Live Activity
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="text-center py-4 text-muted-foreground">Loading activity...</div>
                        ) : activities.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">No recent activity</div>
                        ) : (
                            activities.map((activity) => (
                                <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                                    <Avatar className="h-8 w-8 mt-1">
                                        <AvatarImage src={activity.user?.avatar_url} />
                                        <AvatarFallback className="text-xs">
                                            {(activity.user?.username || 'U').charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-sm">
                                                {activity.user?.username || 'Unknown User'}
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                {getActivityText(activity)}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge
                                                variant="secondary"
                                                className={`text-xs ${getActivityColor(activity.action_type)}`}
                                            >
                                                {getActivityIcon(activity.action_type)}
                                                <span className="ml-1 capitalize">{activity.action_type}</span>
                                            </Badge>

                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3" />
                                                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
};
