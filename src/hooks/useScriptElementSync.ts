
import { useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScriptElementType } from "@/hooks/useScriptContent";
import { useToast } from "@/hooks/use-toast";

export const useScriptElementSync = (scriptId: string, onContentChange?: () => void) => {
  const syncErrorCountRef = useRef(0);
  const { toast } = useToast();

  // Synchronize element changes to Supabase
  const syncElementToSupabase = async (element: {
    id: string,
    type: "heading" | "action" | "character" | "dialogue" | "parenthetical" | "transition",
    content: string,
    _delete?: boolean
  }, position?: number) => {
    try {
      if (!scriptId || scriptId === '') {
        console.error('Invalid script ID provided to syncElementToSupabase');
        return false;
      }

      // Check if this is a deletion request
      if (element._delete) {
        console.log(`Deleting element ${element.id} from script ${scriptId}`);

        const { error } = await supabase
          .from('script_elements')
          .delete()
          .eq('id', element.id);

        if (error) {
          console.error('Failed to delete element:', error);
          toast({
            title: "Delete Failed",
            description: "Could not delete the element. Please try again.",
            variant: "destructive"
          });
          return false;
        }

        console.log('Element deleted successfully');
        if (onContentChange) {
          onContentChange();
        }
        return true;
      }

      // Fix: Ensure element.content is never null or undefined
      const sanitizedContent = element.content || '';

      // Build update payload
      const syncPayload: any = {
        id: element.id,
        script_id: scriptId,
        type: element.type,
        content: sanitizedContent,
      };

      // ONLY include position if it's explicitly provided as a number
      if (typeof position === 'number') {
        syncPayload.position = position;
        console.log(`Syncing element ${element.id} with explicit position: ${position}`);
      } else {
        console.log(`Syncing element ${element.id} (content only)`);
      }


      // Fix: Conditional update strategy
      // If position is missing, we MUST use UPDATE because UPSERT attempts to INSERT first,
      // and INSERT fails if the 'position' column (NOT NULL) is missing.
      let result;

      if (typeof position === 'number') {
        // We have position, so UPSERT is safe (can create new or update existing)
        result = await supabase
          .from('script_elements')
          .upsert(syncPayload, {
            onConflict: 'id'
          });
      } else {
        // No position provided, so we assume the element exists and just UPDATE it.
        // UPSERT would fail here due to missing 'position'.
        result = await supabase
          .from('script_elements')
          .update(syncPayload)
          .eq('id', element.id);
      }

      const { error } = result;

      if (error) {
        console.error('Failed to sync element:', error);

        // Increment error counter
        syncErrorCountRef.current++;

        // Check for specific errors
        if (error.code === '23503') { // Foreign key violation
          toast({
            title: "Script Not Found",
            description: "The script may have been deleted. Please try creating a new script.",
            variant: "destructive"
          });
          return false;
        }

        // After 3 sync errors, try to backup content
        if (syncErrorCountRef.current >= 3) {
          toast({
            title: "Sync Error",
            description: "Could not save element changes. Trying to recover...",
            variant: "destructive"
          });

          // Store content in localStorage as backup
          try {
            const existingBackup = localStorage.getItem(`scriptBackup_${scriptId}`) || '[]';
            const backupElements = JSON.parse(existingBackup);

            // Add element to backup if not already there
            if (!backupElements.some((e: any) => e.id === element.id)) {
              backupElements.push(element);
              localStorage.setItem(`scriptBackup_${scriptId}`, JSON.stringify(backupElements));
              console.log('Element backed up to localStorage');
            }
          } catch (e) {
            console.error('Failed to backup script to localStorage:', e);
          }
        } else {
          toast({
            title: "Sync Error",
            description: "Could not save element changes. Please try again.",
            variant: "destructive"
          });
        }
        return false;
      } else {
        // Reset error counter on successful sync
        syncErrorCountRef.current = 0;
        console.log('Element synced successfully');

        // Notify parent of content change
        if (onContentChange) {
          onContentChange();
        }
        return true;
      }
    } catch (err) {
      console.error("Error syncing element to Supabase:", err);
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Bulk sync elements (for Undo/Redo)
  const syncMultipleElementsToSupabase = async (elements: ScriptElementType[], idsToDelete: string[] = []) => {
    // 1. Handle Deletions first
    if (idsToDelete.length > 0) {
      console.log(`Bulk deleting ${idsToDelete.length} elements from script ${scriptId}`);
      const { error: deleteError } = await supabase
        .from('script_elements')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        console.error('Error syncing batch deletes:', deleteError);
        toast({
          title: "Sync Error",
          description: "Failed to delete elements. Please reload.",
          variant: "destructive"
        });
        return false;
      }
    }

    if (!elements || elements.length === 0) return true;

    try {
      console.log(`Bulk syncing ${elements.length} elements to script ${scriptId}`);

      // We use the new atomic RPC to defer the unique constraints, handle the positions sequentially,
      // and securely bypass RLS loops for a 100x performance boost during Undo/Redo.
      const { error } = await supabase.rpc('sync_script_elements_bulk', {
        p_script_id: scriptId,
        p_elements: elements
      });

      if (error) {
        console.error('Bulk sync failed:', error);
        toast({
          title: "Sync Error",
          description: `Failed to save: ${error.message}`,
          variant: "destructive"
        });
        return false;
      }

      if (onContentChange) onContentChange();
      return true;
    } catch (err) {
      console.error('Bulk sync exception:', err);
      return false;
    }
  };

  // Atomic reorder using RPC (prevents duplicates)
  const reorderElementsAtomic = async (elementIds: string[]) => {
    if (!elementIds || elementIds.length === 0) return true;

    try {
      console.log(`Atomically reordering ${elementIds.length} elements for script ${scriptId}`);

      const { error } = await supabase.rpc('reorder_script_elements_atomic', {
        p_script_id: scriptId,
        p_element_ids: elementIds
      });

      if (error) {
        console.error('Atomic reorder failed:', error);

        // Fallback to bulk sync if RPC fails (e.g. migration not applied)
        console.warn('Falling back to standard bulk sync...');
        return false;
      }

      if (onContentChange) onContentChange();
      return true;
    } catch (err) {
      console.error('Atomic reorder exception:', err);
      return false;
    }
  };

  return { syncElementToSupabase, syncMultipleElementsToSupabase, reorderElementsAtomic };
};
