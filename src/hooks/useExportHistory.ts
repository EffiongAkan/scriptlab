import { useState, useEffect } from 'react';

export interface ExportRecord {
  id: string;
  scriptId: string;
  scriptTitle: string;
  format: string;
  filename: string;
  exportedAt: Date;
  fileSize?: number;
}

export const useExportHistory = (scriptId?: string) => {
  const [exportHistory, setExportHistory] = useState<ExportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadExportHistory();
  }, [scriptId]);

  const loadExportHistory = () => {
    try {
      const stored = localStorage.getItem('scriptExportHistory');
      if (stored) {
        const allHistory: ExportRecord[] = JSON.parse(stored).map((record: any) => ({
          ...record,
          exportedAt: new Date(record.exportedAt)
        }));
        
        // Filter by script ID if provided
        const filtered = scriptId 
          ? allHistory.filter(record => record.scriptId === scriptId)
          : allHistory;
        
        // Sort by most recent first
        filtered.sort((a, b) => b.exportedAt.getTime() - a.exportedAt.getTime());
        
        setExportHistory(filtered);
      }
    } catch (error) {
      console.error('Error loading export history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addExportRecord = (record: Omit<ExportRecord, 'id' | 'exportedAt'>) => {
    const newRecord: ExportRecord = {
      ...record,
      id: crypto.randomUUID(),
      exportedAt: new Date()
    };

    try {
      const stored = localStorage.getItem('scriptExportHistory');
      const allHistory: ExportRecord[] = stored ? JSON.parse(stored) : [];
      
      allHistory.unshift(newRecord);
      
      // Keep only the last 50 exports to prevent localStorage bloat
      const trimmedHistory = allHistory.slice(0, 50);
      
      localStorage.setItem('scriptExportHistory', JSON.stringify(trimmedHistory));
      
      if (!scriptId || record.scriptId === scriptId) {
        setExportHistory(prev => [newRecord, ...prev]);
      }
    } catch (error) {
      console.error('Error saving export record:', error);
    }
  };

  const clearHistory = () => {
    try {
      if (scriptId) {
        // Clear only for this script
        const stored = localStorage.getItem('scriptExportHistory');
        if (stored) {
          const allHistory: ExportRecord[] = JSON.parse(stored);
          const filtered = allHistory.filter(record => record.scriptId !== scriptId);
          localStorage.setItem('scriptExportHistory', JSON.stringify(filtered));
        }
        setExportHistory([]);
      } else {
        // Clear all history
        localStorage.removeItem('scriptExportHistory');
        setExportHistory([]);
      }
    } catch (error) {
      console.error('Error clearing export history:', error);
    }
  };

  const getExportStats = () => {
    const stats = {
      totalExports: exportHistory.length,
      formatBreakdown: {} as Record<string, number>,
      lastExport: exportHistory[0]?.exportedAt,
      totalSize: 0
    };

    exportHistory.forEach(record => {
      stats.formatBreakdown[record.format] = (stats.formatBreakdown[record.format] || 0) + 1;
      stats.totalSize += record.fileSize || 0;
    });

    return stats;
  };

  return {
    exportHistory,
    isLoading,
    addExportRecord,
    clearHistory,
    getExportStats,
    refreshHistory: loadExportHistory
  };
};
