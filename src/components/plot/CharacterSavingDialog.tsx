
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { saveCharacter } from "@/services/character-save-service";
import { supabase } from "@/integrations/supabase/client";

interface CharacterSavingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName?: string;
  defaultDescription?: string;
  defaultBackground?: string;
  defaultTraits?: string[];
  onSaveComplete?: (saved: boolean) => void;
}

export function CharacterSavingDialog({
  open,
  onOpenChange,
  defaultName = "",
  defaultDescription = "",
  defaultBackground = "",
  defaultTraits = [],
  onSaveComplete
}: CharacterSavingDialogProps) {
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState(defaultDescription || "");
  const [background, setBackground] = useState(defaultBackground || "");
  const [traits, setTraits] = useState(defaultTraits.join(", "));
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (open) {
      setName(defaultName || "");
      setDescription(defaultDescription || "");
      setBackground(defaultBackground || "");
      setTraits((defaultTraits || []).join(", "));
    }
  }, [open, defaultName, defaultDescription, defaultBackground, defaultTraits]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please provide a name for your character",
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    const traitsArray = traits.split(",").map((t) => t.trim()).filter(Boolean);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to save characters",
        variant: "destructive",
      });
      setIsSaving(false);
      return;
    }
    try {
      await saveCharacter({
        name: name.trim(),
        description: description.trim(),
        background: background.trim(),
        traits: traitsArray,
        userId: user.id
      });
      toast({ title: "Character Saved", description: "Character has been added to your dashboard" });
      if (onSaveComplete) onSaveComplete(true);
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Save Failed",
        description: err instanceof Error ? err.message : "Unknown error occurred",
        variant: "destructive",
      });
      if (onSaveComplete) onSaveComplete(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Save Character</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-4"
        >
          <Input
            autoFocus
            placeholder="Character Name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <Textarea
            placeholder="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <Textarea
            placeholder="Background"
            value={background}
            onChange={e => setBackground(e.target.value)}
          />
          <Input
            placeholder="Traits (comma separated)"
            value={traits}
            onChange={e => setTraits(e.target.value)}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (<><Loader2 className="animate-spin h-4 w-4 mr-2" /> Saving...</>) : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
