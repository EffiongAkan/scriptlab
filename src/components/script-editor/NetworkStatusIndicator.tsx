
import React, { useState } from 'react';
import { useSyncStatus } from '@/contexts/SyncStatusContext';
import { Wifi, WifiOff, RefreshCw, CloudUpload, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export const NetworkStatusIndicator: React.FC = () => {
  const { isOnline, isSyncing, pendingSyncCount, triggerSync, clearQueue } = useSyncStatus();
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleManualSync = async () => {
    if (isManualSyncing || isSyncing || !isOnline || pendingSyncCount === 0) return;
    setIsManualSyncing(true);
    try {
      await triggerSync();
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleClearQueue = async () => {
    setShowClearConfirm(false);
    await clearQueue();
  };

  const isActivelySyncing = isSyncing || isManualSyncing;
  const hasPending = pendingSyncCount > 0;
  const isClickable = isOnline && hasPending && !isActivelySyncing;

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (isActivelySyncing) return 'Syncing…';
    if (hasPending) return `${pendingSyncCount} pending`;
    return 'Cloud Synced';
  };

  const getIcon = () => {
    if (isActivelySyncing) return <RefreshCw className="h-3.5 w-3.5 animate-spin text-naija-gold" />;
    if (!isOnline) return <WifiOff className="h-3.5 w-3.5 text-amber-500" />;
    if (hasPending) return <CloudUpload className="h-3.5 w-3.5 text-amber-400" />;
    return <Wifi className="h-3.5 w-3.5 text-naija-green" />;
  };

  return (
    <div className="fixed bottom-2 left-14 sm:left-6 z-50 pointer-events-auto flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleManualSync}
              disabled={!isClickable}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border shadow-lg transition-all duration-300 backdrop-blur-md',
                'disabled:cursor-default',
                isOnline
                  ? 'bg-gray-900/80 border-gray-800 text-gray-300'
                  : 'bg-amber-900/40 border-amber-800/50 text-amber-200',
                isClickable && 'hover:bg-gray-800/90 hover:border-gray-700 cursor-pointer'
              )}
            >
              {getIcon()}
              <span className="hidden sm:inline">{getStatusText()}</span>
              {hasPending && !isActivelySyncing && (
                <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent className="bg-gray-900 border-gray-800 text-gray-300 max-w-[220px]">
            <div className="space-y-1">
              {!isOnline && <p className="font-semibold">You are offline</p>}
              {!isOnline && <p className="text-xs opacity-80">Changes saved locally. Will sync on reconnect.</p>}
              {isOnline && !hasPending && <p className="font-semibold">All changes synced ✓</p>}
              {isOnline && hasPending && !isActivelySyncing && (
                <>
                  <p className="font-semibold">{pendingSyncCount} pending change{pendingSyncCount !== 1 ? 's' : ''}</p>
                  <p className="text-xs opacity-80">Click to sync now.</p>
                </>
              )}
              {isActivelySyncing && <p className="font-semibold">Syncing…</p>}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Clear queue button — shown when there are stuck pending items */}
      {hasPending && isOnline && !isActivelySyncing && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {showClearConfirm ? (
                <button
                  onClick={handleClearQueue}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-full text-xs font-medium border shadow-lg bg-red-900/60 border-red-700 text-red-200 hover:bg-red-800/80 transition-all duration-200"
                >
                  <Trash2 className="h-3 w-3" />
                  <span className="hidden sm:inline">Confirm clear</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-full text-xs font-medium border shadow-lg bg-gray-900/60 border-gray-700 text-gray-400 hover:bg-gray-800/80 hover:text-red-300 transition-all duration-200"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </TooltipTrigger>
            <TooltipContent className="bg-gray-900 border-gray-800 text-gray-300 max-w-[200px]">
              <p className="font-semibold text-red-300">Clear local queue</p>
              <p className="text-xs opacity-80">
                Discards {pendingSyncCount} unsynced change{pendingSyncCount !== 1 ? 's' : ''} from local storage.
                Only use if sync is permanently stuck.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};
