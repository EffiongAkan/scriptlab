
import React from 'react';
import { Activity, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CollaborationStatusProps {
  scriptId: string;
}

export const CollaborationStatus = ({ scriptId }: CollaborationStatusProps) => {
  // For now, we'll show a simple online status
  // This can be enhanced later with real connection status
  const isOnline = navigator.onLine;

  return (
    <div className="rounded-md border bg-muted p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-gray-500" />
          <h4 className="text-sm font-semibold">Collaboration Status</h4>
        </div>
        <Badge variant={isOnline ? "default" : "destructive"} className="flex items-center gap-1">
          {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {isOnline ? 'Connected' : 'Offline'}
        </Badge>
      </div>
      <div className="text-sm text-muted-foreground">
        {isOnline 
          ? 'Real-time collaboration is active. Changes will be synced automatically.'
          : 'You are currently offline. Changes will be synced when connection is restored.'
        }
      </div>
    </div>
  );
};
