
import React from 'react';
import { 
  Bell, 
  Check, 
  CheckCircle, 
  Clock, 
  Mail, 
  Info, 
  MessageSquare, 
  UserPlus,
  ArrowRight
} from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'invitation':
        return <UserPlus className="h-4 w-4 text-blue-500" />;
      case 'collaboration':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case 'system':
        return <Bell className="h-4 w-4 text-amber-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
          aria-label={`${unreadCount} unread notifications`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white border-none text-[10px]"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 md:w-96 p-0 mr-4 z-[100]" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs h-7 px-2 text-primary hover:text-primary-dark"
            >
              Mark all as read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          {notifications.length > 0 ? (
            <div className="flex flex-col">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "flex gap-3 p-4 border-b hover:bg-muted/50 transition-colors cursor-pointer group",
                    !notification.read && "bg-primary/5"
                  )}
                >
                  <div className="mt-1 shrink-0">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center",
                      notification.read ? "bg-muted" : "bg-primary/10"
                    )}>
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className={cn(
                        "text-sm font-medium leading-none",
                        !notification.read && "font-bold text-primary"
                      )}>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </div>
                      
                      {notification.action_url ? (
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="h-auto p-0 text-[11px] text-primary font-semibold hover:no-underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNotificationClick(notification);
                          }}
                        >
                          View details
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">
                          Informational message
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No notifications yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                We'll notify you when something important happens.
              </p>
            </div>
          )}
        </ScrollArea>
        
        <div className="p-2 border-t text-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-xs text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/settings?tab=notifications')}
          >
            Notification Settings
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
