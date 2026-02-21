
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Cloud, CloudOff, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSavedAt: Date | null;
  hasUnsavedChanges: boolean;
  className?: string;
}

export const AutoSaveIndicator = ({ 
  isSaving, 
  lastSavedAt, 
  hasUnsavedChanges,
  className 
}: AutoSaveIndicatorProps) => {
  const getStatusInfo = () => {
    if (isSaving) {
      return {
        icon: Cloud,
        text: 'Saving...',
        variant: 'secondary' as const,
        className: 'animate-pulse'
      };
    }
    
    if (hasUnsavedChanges) {
      return {
        icon: Clock,
        text: 'Unsaved changes',
        variant: 'destructive' as const,
        className: 'animate-pulse'
      };
    }
    
    if (lastSavedAt) {
      const now = new Date();
      const diffMs = now.getTime() - lastSavedAt.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      let timeText;
      if (diffMins < 1) {
        timeText = 'Saved now';
      } else if (diffMins === 1) {
        timeText = 'Saved 1m ago';
      } else if (diffMins < 60) {
        timeText = `Saved ${diffMins}m ago`;
      } else {
        const hours = Math.floor(diffMins / 60);
        timeText = `Saved ${hours}h ago`;
      }
      
      return {
        icon: CheckCircle,
        text: timeText,
        variant: 'secondary' as const,
        className: ''
      };
    }
    
    return {
      icon: CloudOff,
      text: 'Not saved',
      variant: 'outline' as const,
      className: ''
    };
  };

  const status = getStatusInfo();
  const StatusIcon = status.icon;

  return (
    <Badge 
      variant={status.variant}
      className={cn(
        'flex items-center gap-1 text-xs font-normal',
        status.className,
        className
      )}
    >
      <StatusIcon className="h-3 w-3" />
      {status.text}
    </Badge>
  );
};
