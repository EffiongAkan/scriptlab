
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { FileText, FileImage, Download, AlertTriangle, Settings, Palette, Calendar, Zap } from 'lucide-react';
import { useScriptExport } from '@/hooks/useScriptExport';
import { useProfile } from '@/hooks/useProfile';
import { ScriptElementType } from '@/hooks/useScriptContent';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdvancedExportOptions } from './export/AdvancedExportOptions';
import { CustomTemplateEditor } from './export/CustomTemplateEditor';
import { ExportHistoryPanel } from './export/ExportHistoryPanel';
import { ScriptExportService } from '@/services/script-export-service';

interface ExportModalProps {
  scriptId: string;
  title: string;
  elements: ScriptElementType[];
  trigger?: React.ReactNode;
}

export const ExportModal = ({ scriptId, title, elements, trigger }: ExportModalProps) => {
  const { exportAsTXT, exportAsPDF, exportAsFountain, validateScriptContent } = useScriptExport();
  const { profile } = useProfile();
  const [open, setOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const { toast } = useToast();

  // Check content validity when modal opens
  const contentValidation = React.useMemo(() => {
    return validateScriptContent(elements);
  }, [elements, validateScriptContent]);

  const handleQuickExport = async (format: 'txt' | 'pdf' | 'fountain') => {
    if (!contentValidation.isValid) {
      toast({
        title: "Cannot Export",
        description: contentValidation.message,
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);

    try {
      const exportTitle = title || 'Untitled Script';
      const authorName = profile?.full_name || profile?.username || 'Author Name';
      const email = profile?.email;
      const phoneNumber = profile?.phone_number;

      switch (format) {
        case 'txt':
          await exportAsTXT(exportTitle, elements, authorName);
          break;
        case 'pdf':
          await exportAsPDF(exportTitle, elements, authorName, email, phoneNumber);
          break;
        case 'fountain':
          await exportAsFountain(exportTitle, elements, authorName);
          break;
      }

      setOpen(false);
    } catch (error) {
      console.error(`Error exporting as ${format}:`, error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleAdvancedExport = async (options: any) => {
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
          top: 1,
          bottom: 1,
          left: 1,
          right: 1
        },
        watermark: options.includeWatermark ? options.watermarkText : undefined
      };

      // Export the script using the service
      const result = await ScriptExportService.exportScript(
        title,
        elements,
        exportOptions
      );

      if (result.success && result.blob) {
        // Download the file
        ScriptExportService.downloadFile(result.blob, result.filename);

        toast({
          title: "Export Successful",
          description: `Your script has been exported as ${options.format}`,
        });
        setOpen(false);
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

  const getContentStats = () => {
    if (!elements || elements.length === 0) return null;

    const validElements = elements.filter(el => el && el.content && el.content.trim() !== '');
    const wordCount = validElements.reduce((count, el) => {
      return count + (el.content?.split(/\s+/).length || 0);
    }, 0);

    return {
      elements: validElements.length,
      words: wordCount,
      pages: Math.max(1, Math.ceil(wordCount / 250)) // Rough estimate
    };
  };

  const stats = getContentStats();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Script
          </DialogTitle>
          <DialogDescription>
            Choose between quick export or advanced formatting options
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="quick" className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="quick" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Quick Export
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Advanced
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 max-h-[calc(90vh-180px)] overflow-y-auto px-1">
            <TabsContent value="quick" className="mt-0">
              {/* Content validation warning */}
              {!contentValidation.isValid && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">{contentValidation.message}</span>
                </div>
              )}

              {/* Content statistics */}
              {stats && contentValidation.isValid && (
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md mb-6">
                  <p>Content: {stats.elements} elements • {stats.words} words • ~{stats.pages} pages</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button
                  onClick={() => handleQuickExport('txt')}
                  variant="outline"
                  className="flex flex-col h-auto min-h-[8rem] p-4 whitespace-normal hover:border-primary hover:bg-primary/5 transition-all"
                  disabled={!contentValidation.isValid || isExporting}
                  aria-label="Export as Text"
                >
                  <FileText className="h-10 w-10 mb-3 flex-shrink-0 text-primary" />
                  <span className="text-base font-semibold mb-1">Text (.txt)</span>
                  <span className="text-xs text-muted-foreground text-center leading-tight">
                    Simple text format for sharing
                  </span>
                </Button>

                <Button
                  onClick={() => handleQuickExport('pdf')}
                  variant="outline"
                  className="flex flex-col h-auto min-h-[8rem] p-4 whitespace-normal hover:border-primary hover:bg-primary/5 transition-all"
                  disabled={!contentValidation.isValid || isExporting}
                  aria-label="Export as PDF"
                >
                  <FileImage className="h-10 w-10 mb-3 flex-shrink-0 text-primary" />
                  <span className="text-base font-semibold mb-1">PDF (.pdf)</span>
                  <span className="text-xs text-muted-foreground text-center leading-tight">
                    Professional format for printing
                  </span>
                </Button>

                <Button
                  onClick={() => handleQuickExport('fountain')}
                  variant="outline"
                  className="flex flex-col h-auto min-h-[8rem] p-4 whitespace-normal hover:border-primary hover:bg-primary/5 transition-all"
                  disabled={!contentValidation.isValid || isExporting}
                  aria-label="Export as Fountain"
                >
                  <FileText className="h-10 w-10 mb-3 flex-shrink-0 text-primary" />
                  <span className="text-base font-semibold mb-1">Fountain</span>
                  <span className="text-xs text-muted-foreground text-center leading-tight">
                    Industry standard screenplay format
                  </span>
                </Button>
              </div>

              {isExporting && (
                <div className="text-center text-sm text-muted-foreground mt-6 animate-pulse">
                  Generating your file...
                </div>
              )}
            </TabsContent>

            <TabsContent value="advanced" className="mt-0">
              <AdvancedExportOptions
                onExport={handleAdvancedExport}
                isExporting={isExporting}
              />
            </TabsContent>

            <TabsContent value="templates" className="mt-0">
              <CustomTemplateEditor
                onTemplateSelect={(template) => toast({ title: "Template Selected", description: template.name })}
              />
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <ExportHistoryPanel
                scriptId={scriptId}
              />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
