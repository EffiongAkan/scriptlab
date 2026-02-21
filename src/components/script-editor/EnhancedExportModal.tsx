
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdvancedExportOptions } from './export/AdvancedExportOptions';
import { CustomTemplateEditor } from './export/CustomTemplateEditor';
import { ExportHistoryPanel } from './export/ExportHistoryPanel';
import { Download, Settings, Palette, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScriptExportService } from '@/services/script-export-service';
import { ScriptElementType } from '@/hooks/useScriptContent';

interface EnhancedExportModalProps {
  scriptId: string;
  scriptTitle: string;
  elements: any[];
  trigger: React.ReactNode;
}

export const EnhancedExportModal: React.FC<EnhancedExportModalProps> = ({
  scriptId,
  scriptTitle,
  elements,
  trigger
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const { toast } = useToast();

  const handleExport = async (options: any) => {
    setIsExporting(true);
    try {
      // Convert the advanced export options to the service format
      const exportOptions = {
        format: options.format.toLowerCase() as 'pdf' | 'fountain' | 'fdx' | 'docx' | 'txt',
        includeTitle: options.includeTitle,
        includeCoverPage: options.includeTitle,
        pageNumbers: options.includePageNumbers,
        fontSize: 12,
        margins: {
          top: 25,
          bottom: 25,
          left: 25,
          right: 25
        },
        watermark: options.includeWatermark ? options.watermarkText : undefined
      };

      // Export the script using the service
      const result = await ScriptExportService.exportScript(
        scriptTitle,
        elements as ScriptElementType[],
        exportOptions
      );

      if (result.success && result.blob) {
        // Download the file
        ScriptExportService.downloadFile(result.blob, result.filename);
        
        toast({
          title: "Export Successful",
          description: `Your script has been exported as ${options.format}`,
        });
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "There was an error exporting your script",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    toast({
      title: "Template Selected",
      description: `Using template: ${template.name}`,
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Advanced Export - {scriptTitle}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 max-h-[calc(90vh-120px)] overflow-y-auto">
            <TabsContent value="export">
              <AdvancedExportOptions 
                onExport={handleExport}
                isExporting={isExporting}
              />
            </TabsContent>

            <TabsContent value="templates">
              <CustomTemplateEditor 
                onTemplateSelect={handleTemplateSelect}
              />
            </TabsContent>

            <TabsContent value="history">
              <ExportHistoryPanel 
                scriptId={scriptId}
              />
            </TabsContent>

            <TabsContent value="settings">
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Export settings and preferences</p>
                <p className="text-sm">Coming soon...</p>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
