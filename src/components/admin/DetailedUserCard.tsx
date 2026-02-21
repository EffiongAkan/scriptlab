
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users,
  Mail,
  Calendar,
  CreditCard,
  Pause,
  Play,
  Trash2,
  Edit,
  Shield,
  Activity,
  FileText,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DetailedUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
  profile?: {
    username?: string;
    full_name?: string;
    avatar_url?: string;
    ai_credits?: number;
  };
  subscription?: {
    tier?: string;
    status?: string;
    ends_at?: string;
  };
  activity?: {
    scripts_count: number;
    last_active: string;
    total_ai_usage: number;
  };
  status: 'active' | 'paused' | 'banned';
}

interface DetailedUserCardProps {
  user: DetailedUser;
  onUpdateUser: (userId: string, updates: any) => void;
  onDeleteUser: (userId: string) => void;
  onSendNotification: (userId: string) => void;
}

export const DetailedUserCard: React.FC<DetailedUserCardProps> = ({
  user,
  onUpdateUser,
  onDeleteUser,
  onSendNotification
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [credits, setCredits] = useState(user.profile?.ai_credits || 0);
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'banned': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusToggle = () => {
    const newStatus = user.status === 'active' ? 'paused' : 'active';
    onUpdateUser(user.id, { status: newStatus });
  };

  const handleUpdateCredits = () => {
    onUpdateUser(user.id, { ai_credits: credits });
    setIsEditing(false);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={user.profile?.avatar_url} />
              <AvatarFallback>
                {user.profile?.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
              <CardTitle className="text-lg truncate">{user.profile?.full_name || 'Unknown'}</CardTitle>
              <p className="text-sm text-muted-foreground truncate">@{user.profile?.username || 'no-username'}</p>
            </div>
          </div>
          <Badge className={getStatusColor(user.status)}>
            {user.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div className="grid grid-cols-1 gap-3 text-sm">
          <div className="flex items-center gap-2 min-w-0">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="truncate">{user.email}</span>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="truncate text-nowrap">Joined {new Date(user.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Subscription Info */}
        {user.subscription && (
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span>{user.subscription.tier} Plan</span>
            <Badge variant="secondary">{user.subscription.status}</Badge>
          </div>
        )}

        {/* Activity Stats */}
        <div className="grid grid-cols-3 gap-3 text-center border rounded-lg p-3">
          <div>
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <FileText className="h-3 w-3" />
              Scripts
            </div>
            <div className="font-semibold">{user.activity?.scripts_count || 0}</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <Zap className="h-3 w-3" />
              Credits
            </div>
            <div className="font-semibold">{user.profile?.ai_credits || 0}</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <Activity className="h-3 w-3" />
              AI Usage
            </div>
            <div className="font-semibold">{user.activity?.total_ai_usage || 0}</div>
          </div>
        </div>

        {/* Credits Management */}
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Input
                type="number"
                value={credits}
                onChange={(e) => setCredits(parseInt(e.target.value))}
                className="w-20"
              />
              <Button size="sm" onClick={handleUpdateCredits}>Save</Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="h-3 w-3 mr-1" />
              Edit Credits
            </Button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={handleStatusToggle}
            className="flex-1"
          >
            {user.status === 'active' ? (
              <>
                <Pause className="h-3 w-3 mr-1" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-3 w-3 mr-1" />
                Activate
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onSendNotification(user.id)}
          >
            <Mail className="h-3 w-3 mr-1" />
            Notify
          </Button>

          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDeleteUser(user.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
