
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Palette, Save, Plus, Edit, Trash2 } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  format: string;
  isDefault: boolean;
  settings: {
    fontSize: number;
    fontFamily: string;
    margins: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
    pageNumbers: boolean;
    watermark?: string;
    headerText?: string;
    footerText?: string;
  };
}

interface CustomTemplateEditorProps {
  onTemplateSelect: (template: Template) => void;
}

export const CustomTemplateEditor: React.FC<CustomTemplateEditorProps> = ({
  onTemplateSelect
}) => {
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: '1',
      name: 'Standard Screenplay',
      description: 'Industry standard format for screenplays',
      format: 'PDF',
      isDefault: true,
      settings: {
        fontSize: 12,
        fontFamily: 'Courier New',
        margins: { top: 1, bottom: 1, left: 1.5, right: 1 },
        pageNumbers: true
      }
    },
    {
      id: '2',
      name: 'Nigerian Film Format',
      description: 'Adapted format for Nollywood productions',
      format: 'PDF',
      isDefault: false,
      settings: {
        fontSize: 12,
        fontFamily: 'Arial',
        margins: { top: 1.2, bottom: 1.2, left: 1.5, right: 1 },
        pageNumbers: true,
        headerText: 'NOLLYWOOD PRODUCTION'
      }
    }
  ]);
  
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateNew = () => {
    const newTemplate: Template = {
      id: Date.now().toString(),
      name: 'New Template',
      description: '',
      format: 'PDF',
      isDefault: false,
      settings: {
        fontSize: 12,
        fontFamily: 'Courier New',
        margins: { top: 1, bottom: 1, left: 1.5, right: 1 },
        pageNumbers: true
      }
    };
    setEditingTemplate(newTemplate);
    setIsCreating(true);
  };

  const handleSaveTemplate = () => {
    if (editingTemplate) {
      if (isCreating) {
        setTemplates(prev => [...prev, editingTemplate]);
      } else {
        setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? editingTemplate : t));
      }
      setEditingTemplate(null);
      setIsCreating(false);
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
  };

  return (
    <div className="space-y-6">
      {/* Template List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Export Templates
            </div>
            <Button size="sm" onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {templates.map((template) => (
                <div key={template.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{template.name}</span>
                      {template.isDefault && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingTemplate(template)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      {!template.isDefault && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {template.settings.fontFamily} • {template.settings.fontSize}pt
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onTemplateSelect(template)}
                    >
                      Use Template
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Template Editor */}
      {editingTemplate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{isCreating ? 'Create Template' : 'Edit Template'}</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveTemplate}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Template Name</label>
                <Input
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({
                    ...editingTemplate,
                    name: e.target.value
                  })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Format</label>
                <Select
                  value={editingTemplate.format}
                  onValueChange={(value) => setEditingTemplate({
                    ...editingTemplate,
                    format: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="DOCX">DOCX</SelectItem>
                    <SelectItem value="HTML">HTML</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={editingTemplate.description}
                onChange={(e) => setEditingTemplate({
                  ...editingTemplate,
                  description: e.target.value
                })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Font Family</label>
                <Select
                  value={editingTemplate.settings.fontFamily}
                  onValueChange={(value) => setEditingTemplate({
                    ...editingTemplate,
                    settings: { ...editingTemplate.settings, fontFamily: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Courier New">Courier New</SelectItem>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Font Size</label>
                <Input
                  type="number"
                  value={editingTemplate.settings.fontSize}
                  onChange={(e) => setEditingTemplate({
                    ...editingTemplate,
                    settings: { ...editingTemplate.settings, fontSize: parseInt(e.target.value) }
                  })}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">Top Margin</label>
                <Input
                  type="number"
                  step="0.1"
                  value={editingTemplate.settings.margins.top}
                  onChange={(e) => setEditingTemplate({
                    ...editingTemplate,
                    settings: {
                      ...editingTemplate.settings,
                      margins: { ...editingTemplate.settings.margins, top: parseFloat(e.target.value) }
                    }
                  })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Bottom Margin</label>
                <Input
                  type="number"
                  step="0.1"
                  value={editingTemplate.settings.margins.bottom}
                  onChange={(e) => setEditingTemplate({
                    ...editingTemplate,
                    settings: {
                      ...editingTemplate.settings,
                      margins: { ...editingTemplate.settings.margins, bottom: parseFloat(e.target.value) }
                    }
                  })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Left Margin</label>
                <Input
                  type="number"
                  step="0.1"
                  value={editingTemplate.settings.margins.left}
                  onChange={(e) => setEditingTemplate({
                    ...editingTemplate,
                    settings: {
                      ...editingTemplate.settings,
                      margins: { ...editingTemplate.settings.margins, left: parseFloat(e.target.value) }
                    }
                  })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Right Margin</label>
                <Input
                  type="number"
                  step="0.1"
                  value={editingTemplate.settings.margins.right}
                  onChange={(e) => setEditingTemplate({
                    ...editingTemplate,
                    settings: {
                      ...editingTemplate.settings,
                      margins: { ...editingTemplate.settings.margins, right: parseFloat(e.target.value) }
                    }
                  })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={editingTemplate.settings.pageNumbers}
                onCheckedChange={(checked) => setEditingTemplate({
                  ...editingTemplate,
                  settings: { ...editingTemplate.settings, pageNumbers: checked }
                })}
              />
              <label className="text-sm font-medium">Include Page Numbers</label>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
