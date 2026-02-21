
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Calendar, FileText, Eye, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ExportRecord {
  id: string;
  fileName: string;
  format: string;
  createdAt: Date;
  fileSize: string;
  status: 'completed' | 'processing' | 'failed';
  downloadUrl?: string;
}

interface ExportHistoryPanelProps {
  scriptId: string;
}

export const ExportHistoryPanel: React.FC<ExportHistoryPanelProps> = ({
  scriptId
}) => {
  const [exportHistory, setExportHistory] = useState<ExportRecord[]>([
    {
      id: '1',
      fileName: 'My Script - Final Draft.pdf',
      format: 'PDF',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      fileSize: '2.4 MB',
      status: 'completed',
      downloadUrl: '#'
    },
    {
      id: '2',
      fileName: 'My Script - Draft v2.docx',
      format: 'DOCX',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      fileSize: '1.8 MB',
      status: 'completed',
      downloadUrl: '#'
    },
    {
      id: '3',
      fileName: 'My Script - Fountain.fountain',
      format: 'Fountain',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      fileSize: '156 KB',
      status: 'completed',
      downloadUrl: '#'
    }
  ]);

  const getStatusColor = (status: ExportRecord['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
    }
  };

  const getFormatIcon = (format: string) => {
    return <FileText className="h-4 w-4" />;
  };

  const handleDownload = (record: ExportRecord) => {
    // Mock download functionality
    console.log('Downloading:', record.fileName);
  };

  const handleDelete = (recordId: string) => {
    setExportHistory(prev => prev.filter(record => record.id !== recordId));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Export History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          <div className="space-y-3">
            {exportHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No exports yet</p>
                <p className="text-sm">Your export history will appear here</p>
              </div>
            ) : (
              exportHistory.map((record) => (
                <div key={record.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getFormatIcon(record.format)}
                      <span className="font-medium text-sm">{record.fileName}</span>
                    </div>
                    <Badge className={`text-xs ${getStatusColor(record.status)}`}>
                      {record.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>{record.format} • {record.fileSize}</span>
                    <span>{formatDistanceToNow(record.createdAt, { addSuffix: true })}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {record.status === 'completed' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(record)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Preview
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(record.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
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
