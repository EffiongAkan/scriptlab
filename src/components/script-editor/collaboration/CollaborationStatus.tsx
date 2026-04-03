
import React from 'react';
import { Activity, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSyncStatus } from '@/contexts/SyncStatusContext';

interface CollaborationStatusProps {
  scriptId: string;
}

export const CollaborationStatus = ({ scriptId }: CollaborationStatusProps) => {
  // Use the shared sync context so this stays in sync with the rest of the app
  const { isOnline, isSyncing, pendingSyncCount } = useSyncStatus();

  const getStatusBadge = () => {
    if (!isOnline) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <WifiOff className="h-3 w-3" />
          Offline
        </Badge>
      );
    }
    if (isSyncing) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Syncing...
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="flex items-center gap-1">
        <Wifi className="h-3 w-3" />
        Connected
      </Badge>
    );
  };

  const getStatusMessage = () => {
    if (!isOnline) {
      return 'You are currently offline. Changes will be synced when connection is restored.';
    }
    if (isSyncing) {
      return 'Syncing offline changes to the cloud…';
    }
    if (pendingSyncCount > 0) {
      return `${pendingSyncCount} change${pendingSyncCount !== 1 ? 's' : ''} waiting to sync.`;
    }
    return 'Real-time collaboration is active. Changes are synced automatically.';
  };

  return (
    <div className="rounded-md border bg-muted p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-gray-500" />
          <h4 className="text-sm font-semibold">Collaboration Status</h4>
        </div>
        {getStatusBadge()}
      </div>
      <div className="text-sm text-muted-foreground">
        {getStatusMessage()}
      </div>
    </div>
  );
};
