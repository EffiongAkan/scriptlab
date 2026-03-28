
import React from 'react';
import { useSyncStatus } from '@/contexts/SyncStatusContext';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export const NetworkStatusIndicator: React.FC = () => {
  const { isOnline, isSyncing, pendingSyncCount } = useSyncStatus();

  return (
    <div className="fixed bottom-2 left-6 z-50 pointer-events-auto">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border shadow-lg transition-all duration-300 backdrop-blur-md",
                isOnline 
                  ? "bg-gray-900/80 border-gray-800 text-gray-300" 
                  : "bg-amber-900/40 border-amber-800/50 text-amber-200"
              )}
            >
              {isSyncing ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-naija-gold" />
              ) : isOnline ? (
                pendingSyncCount > 0 ? (
                  <RefreshCw className="h-3.5 w-3.5 text-amber-400" />
                ) : (
                  <Wifi className="h-3.5 w-3.5 text-naija-green" />
                )
              ) : (
                <WifiOff className="h-3.5 w-3.5 text-amber-500" />
              )}
              
              <span className="hidden sm:inline">
                {!isOnline ? 'Offline' : isSyncing ? 'Syncing...' : pendingSyncCount > 0 ? `${pendingSyncCount} pending` : 'Cloud Synced'}
              </span>
              
              {pendingSyncCount > 0 && (
                <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-gray-900 border-gray-800 text-gray-300">
            <div className="space-y-1">
              <p className="font-semibold">{!isOnline ? 'You are offline' : 'You are online'}</p>
              <p className="text-xs opacity-80">
                {!isOnline 
                  ? `Changes will be saved locally and synced when you reconnect.` 
                  : pendingSyncCount > 0 
                    ? `Synchronizing ${pendingSyncCount} local changes...` 
                    : `All changes are synchronized with the cloud.`}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
