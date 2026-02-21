
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Edit, Save, X, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface SynopsisPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  synopsis: {
    id: string;
    title: string;
    content: string;
    created_at: string;
  } | null;
  onUpdate: () => void;
}

export function SynopsisPreviewModal({ isOpen, onClose, synopsis, onUpdate }: SynopsisPreviewModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (synopsis) {
      setEditedTitle(synopsis.title);
      setEditedContent(synopsis.content);
    }
  }, [synopsis]);

  const handleSave = async () => {
    if (!synopsis) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('synopses')
        .update({
          title: editedTitle,
          content: editedContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', synopsis.id);

      if (error) throw error;

      toast({
        title: "Synopsis Updated",
        description: "Your changes have been saved successfully.",
      });

      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error saving synopsis:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save changes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateScript = async () => {
    if (!synopsis) return;

    setIsGenerating(true);
    try {
      // Prepare minimal data for Plot Generator to avoid localStorage quota limits
      const plotGeneratorData = {
        title: synopsis.title,
        genre: 'Drama', // Default genre
        fromSynopsis: true,
        synopsisId: synopsis.id, // Only pass the ID, content will be fetched by PlotGenerator
        savedSynopsis: {
          id: synopsis.id,
          title: synopsis.title,
          tone: 'Dramatic'
        }
      };

      // Store in localStorage for Plot Generator
      localStorage.setItem('plotGeneratorData', JSON.stringify(plotGeneratorData));

      toast({
        title: "Opening Script Generator",
        description: "Configure your production settings to generate the script...",
      });

      // Close modal and navigate to Plot Generator
      onClose();
      navigate('/plot-generator');

    } catch (error) {
      console.error('Error navigating to plot generator:', error);
      toast({
        title: "Navigation Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!synopsis) return;

    const content = `${synopsis.title}\n\nCreated: ${new Date(synopsis.created_at).toLocaleDateString()}\n\n${synopsis.content}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${synopsis.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Started",
      description: "Your synopsis has been downloaded as a text file.",
    });
  };

  const handleCancel = () => {
    if (synopsis) {
      setEditedTitle(synopsis.title);
      setEditedContent(synopsis.content);
    }
    setIsEditing(false);
  };

  if (!synopsis) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="font-semibold"
                  />
                </div>
              ) : (
                <DialogTitle className="text-xl">{synopsis.title}</DialogTitle>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="ml-4"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Created on {new Date(synopsis.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isEditing ? (
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
                placeholder="Enter your synopsis content..."
              />
            </div>
          ) : (
            <div className="prose max-w-none">
              <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {synopsis.content}
                </pre>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button
              variant="default"
              onClick={handleGenerateScript}
              disabled={isGenerating}
              className="flex items-center gap-2 bg-naija-green hover:bg-naija-green-dark"
            >
              <Sparkles className="h-4 w-4" />
              {isGenerating ? "Creating..." : "Generate Script"}
            </Button>
          </div>

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
