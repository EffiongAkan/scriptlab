
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Settings, Download, FileText, Image, Globe } from 'lucide-react';

interface ExportOptions {
  format: string;
  quality: number;
  includeTitle: boolean;
  includePageNumbers: boolean;
  includeWatermark: boolean;
  watermarkText: string;
  colorMode: 'color' | 'grayscale' | 'blackwhite';
  paperSize: string;
  orientation: 'portrait' | 'landscape';
  compression: boolean;
  password?: string;
  metadata: {
    author: string;
    producer: string;
    subject: string;
    keywords: string;
  };
}

interface AdvancedExportOptionsProps {
  onExport: (options: ExportOptions) => void;
  isExporting: boolean;
}

export const AdvancedExportOptions: React.FC<AdvancedExportOptionsProps> = ({
  onExport,
  isExporting
}) => {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'PDF',
    quality: 95,
    includeTitle: true,
    includePageNumbers: true,
    includeWatermark: false,
    watermarkText: 'CONFIDENTIAL',
    colorMode: 'color',
    paperSize: 'A4',
    orientation: 'portrait',
    compression: true,
    metadata: {
      author: '',
      producer: 'ScriptForge',
      subject: '',
      keywords: ''
    }
  });

  const formatOptions = [
    { value: 'PDF', label: 'PDF Document', icon: <FileText className="h-4 w-4" /> },
    { value: 'DOCX', label: 'Word Document', icon: <FileText className="h-4 w-4" /> },
    { value: 'HTML', label: 'Web Page', icon: <Globe className="h-4 w-4" /> },
    { value: 'TXT', label: 'Plain Text', icon: <FileText className="h-4 w-4" /> },
    { value: 'FOUNTAIN', label: 'Fountain Format', icon: <FileText className="h-4 w-4" /> },
    { value: 'PNG', label: 'Image Export', icon: <Image className="h-4 w-4" /> }
  ];

  const handleExport = () => {
    onExport(options);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Export Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Format Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Export Format</label>
            <div className="grid grid-cols-2 gap-2">
              {formatOptions.map((format) => (
                <div
                  key={format.value}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    options.format === format.value 
                      ? 'border-primary bg-primary/5' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setOptions({ ...options, format: format.value })}
                >
                  <div className="flex items-center gap-2">
                    {format.icon}
                    <span className="text-sm font-medium">{format.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quality Settings */}
          {(options.format === 'PDF' || options.format === 'PNG') && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Export Quality: {options.quality}%
              </label>
              <Slider
                value={[options.quality]}
                onValueChange={(value) => setOptions({ ...options, quality: value[0] })}
                max={100}
                min={50}
                step={5}
                className="w-full"
              />
            </div>
          )}

          {/* Page Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Paper Size</label>
              <Select
                value={options.paperSize}
                onValueChange={(value) => setOptions({ ...options, paperSize: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4</SelectItem>
                  <SelectItem value="Letter">Letter</SelectItem>
                  <SelectItem value="Legal">Legal</SelectItem>
                  <SelectItem value="A3">A3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Orientation</label>
              <Select
                value={options.orientation}
                onValueChange={(value: 'portrait' | 'landscape') => setOptions({ ...options, orientation: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="landscape">Landscape</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Display Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Include Title Page</label>
              <Switch
                checked={options.includeTitle}
                onCheckedChange={(checked) => setOptions({ ...options, includeTitle: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Include Page Numbers</label>
              <Switch
                checked={options.includePageNumbers}
                onCheckedChange={(checked) => setOptions({ ...options, includePageNumbers: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Enable Compression</label>
              <Switch
                checked={options.compression}
                onCheckedChange={(checked) => setOptions({ ...options, compression: checked })}
              />
            </div>
          </div>

          {/* Watermark Settings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Add Watermark</label>
              <Switch
                checked={options.includeWatermark}
                onCheckedChange={(checked) => setOptions({ ...options, includeWatermark: checked })}
              />
            </div>
            {options.includeWatermark && (
              <Input
                placeholder="Watermark text..."
                value={options.watermarkText}
                onChange={(e) => setOptions({ ...options, watermarkText: e.target.value })}
              />
            )}
          </div>

          {/* Color Mode */}
          <div>
            <label className="text-sm font-medium mb-2 block">Color Mode</label>
            <Select
              value={options.colorMode}
              onValueChange={(value: 'color' | 'grayscale' | 'blackwhite') => setOptions({ ...options, colorMode: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="color">Full Color</SelectItem>
                <SelectItem value="grayscale">Grayscale</SelectItem>
                <SelectItem value="blackwhite">Black & White</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Security */}
          {options.format === 'PDF' && (
            <div>
              <label className="text-sm font-medium">PDF Password (Optional)</label>
              <Input
                type="password"
                placeholder="Enter password to protect PDF..."
                value={options.password || ''}
                onChange={(e) => setOptions({ ...options, password: e.target.value })}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Document Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Author</label>
              <Input
                value={options.metadata.author}
                onChange={(e) => setOptions({
                  ...options,
                  metadata: { ...options.metadata, author: e.target.value }
                })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Subject</label>
              <Input
                value={options.metadata.subject}
                onChange={(e) => setOptions({
                  ...options,
                  metadata: { ...options.metadata, subject: e.target.value }
                })}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Keywords</label>
            <Input
              placeholder="drama, nollywood, screenplay..."
              value={options.metadata.keywords}
              onChange={(e) => setOptions({
                ...options,
                metadata: { ...options.metadata, keywords: e.target.value }
              })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleExport}
          disabled={isExporting}
          className="min-w-[200px]"
        >
          <Download className="h-5 w-5 mr-2" />
          {isExporting ? 'Exporting...' : 'Export Script'}
        </Button>
      </div>
    </div>
  );
};
