
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { savePlotContent, updatePlotContent } from "@/services/plot-save-service";
import { supabase } from "@/integrations/supabase/client";
import { Genre, SubGenre, Language } from "@/types";

interface PlotSavingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  genre?: Genre;
  subGenres?: SubGenre[];
  language?: Language;
  plotId?: string;
  defaultTitle?: string;
  onSaveComplete?: (saved: boolean, plotId?: string) => void;
}

export function PlotSavingDialog({
  open,
  onOpenChange,
  content,
  genre,
  subGenres,
  language,
  plotId,
  defaultTitle = "",
  onSaveComplete
}: PlotSavingDialogProps) {
  const [title, setTitle] = useState(defaultTitle || "");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      if (!title.trim()) {
        toast({
          title: "Title required",
          description: "Please enter a title for your plot",
          variant: "destructive",
        });
        return;
      }
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        toast({
          title: "Authentication required",
          description: "You must be logged in to save plots",
          variant: "destructive",
        });
        return;
      }
      
      let result;
      
      if (plotId) {
        // Update existing plot
        result = await updatePlotContent(
          plotId, 
          {
            title: title.trim(),
            content,
            genre,
            subGenres,
            language,
          }
        );
      } else {
        // Create new plot
        result = await savePlotContent({
          title: title.trim(),
          content,
          genre,
          subGenres,
          language,
          userId: user.id
        });
      }
      
      if (result.success) {
        toast({
          title: plotId ? "Plot updated" : "Plot saved",
          description: plotId 
            ? "Your plot has been updated successfully" 
            : "Your plot has been saved successfully",
        });
        
        if (onSaveComplete) {
          onSaveComplete(true, result.id);
        }
        
        onOpenChange(false);
      } else {
        throw new Error(result.error || "Failed to save plot");
      }
    } catch (error) {
      console.error("Plot save error:", error);
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      
      if (onSaveComplete) {
        onSaveComplete(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{plotId ? "Update Plot" : "Save Plot"}</DialogTitle>
          <DialogDescription>
            {plotId 
              ? "Update your plot with a new title or content." 
              : "Give your plot a title and save it to your account."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
              placeholder="Enter a title for your plot"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-naija-green hover:bg-naija-green-dark"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              plotId ? "Update" : "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
