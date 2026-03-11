
import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ScriptElementType } from '@/hooks/useScriptContent';
import { useScriptUUID } from '@/hooks/useScriptUUID';
import { useScriptMetadata } from '@/hooks/useScriptMetadata';
import { useScriptElements } from '@/hooks/useScriptElements';
import { supabase } from '@/integrations/supabase/client';

export const useScriptSave = (scriptId: string) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const { toast } = useToast();
  const { isValidUuid, generateUuid } = useScriptUUID();
  const { saveScriptMetadata } = useScriptMetadata();
  const { saveElements } = useScriptElements();

  const saveInProgressRef = useRef(false);

  // Enhanced save function with proper coordination between metadata and elements
  const saveScript = useCallback(async (elements: ScriptElementType[], title?: string, treatment?: string): Promise<boolean> => {
    if (saveInProgressRef.current) {
      console.log('Save already in progress, skipping duplicate save');
      return false;
    }

    if (!scriptId || scriptId === '') {
      console.log("No script ID provided to save function");
      toast({
        title: "Error",
        description: "Cannot save: Invalid script ID",
        variant: "destructive",
      });
      return false;
    }

    saveInProgressRef.current = true;
    setIsSaving(true);

    try {
      console.log('Starting coordinated save process for script:', scriptId);

      // Validate and sanitize elements
      const elementsToSave = Array.isArray(elements)
        ? elements.filter(el => el && el.id && el.type).map(el => ({
          ...el,
          content: el.content || '' // Ensure content is never null
        }))
        : [];

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast({
          title: "Authentication Error",
          description: "Please sign in again to save your script.",
          variant: "destructive",
        });
        return false;
      }

      const userId = user.id;
      const validScriptId = isValidUuid(scriptId) ? scriptId : generateUuid();
      const scriptTitle = title && title.trim() !== '' ? title.trim() : 'Untitled Script';

      // Save metadata and elements in sequence to ensure consistency
      console.log('Saving metadata first...');
      const metadataSuccess = await saveScriptMetadata(validScriptId, userId, scriptTitle, treatment);

      if (!metadataSuccess) {
        throw new Error('Failed to save script metadata');
      }

      console.log('Metadata saved, now saving elements...');
      const elementsSuccess = await saveElements(validScriptId, elementsToSave);

      if (!elementsSuccess) {
        throw new Error('Failed to save script elements');
      }

      // Handle script ID change (new script creation)
      if (validScriptId !== scriptId) {
        console.log('New script created, redirecting...');
        toast({
          title: "Script Created",
          description: "Redirecting to your new script...",
        });

        setTimeout(() => {
          window.location.href = `/editor/${validScriptId}`;
        }, 1500);

        return true;
      }

      // Update last saved timestamp
      setLastSavedAt(new Date());

      // Success feedback
      toast({
        title: "Script Saved",
        description: `"${scriptTitle}" saved successfully with ${elementsToSave.length} elements`,
      });

      // Clear backup after successful save
      try {
        localStorage.removeItem(`scriptBackup_${scriptId}`);
        console.log('Removed backup after successful save');
      } catch (e) {
        console.error('Error removing script backup:', e);
      }

      return true;

    } catch (error) {
      console.error('Error in coordinated saveScript:', error);

      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save script. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      saveInProgressRef.current = false;
      setIsSaving(false);
    }
  }, [scriptId, isValidUuid, generateUuid, saveScriptMetadata, saveElements, toast]);

  // Auto-save function with better debouncing
  const autoSave = useCallback(async (elements: ScriptElementType[], title?: string, treatment?: string): Promise<boolean> => {
    if (saveInProgressRef.current) {
      console.log('Save already in progress, skipping auto-save');
      return false;
    }

    try {
      console.log('Auto-saving script...');
      const success = await saveScript(elements, title, treatment);
      if (success) {
        console.log('Auto-save completed successfully');
      }
      return success;
    } catch (error) {
      console.error('Auto-save failed:', error);
      return false;
    }
  }, [saveScript]);

  // Get save status for UI feedback
  const getSaveStatus = useCallback(() => {
    if (isSaving) return 'saving';
    if (lastSavedAt) return 'saved';
    return 'unsaved';
  }, [isSaving, lastSavedAt]);

  return {
    saveScript,
    autoSave,
    isSaving,
    lastSavedAt,
    saveStatus: getSaveStatus()
  };
};
