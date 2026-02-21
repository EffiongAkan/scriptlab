
/**
 * Hook for managing script elements operations
 */
import { supabase } from '@/integrations/supabase/client';
import { ScriptElementType } from '@/hooks/useScriptContent';
import { useToast } from '@/hooks/use-toast';

export const useScriptElements = () => {
  const { toast } = useToast();

  /**
   * Saves script elements to the database
   * @param scriptId - The script ID
   * @param elements - Array of script elements to save
   * @returns Promise with boolean success status
   */
  const saveElements = async (
    scriptId: string,
    elements: ScriptElementType[]
  ): Promise<boolean> => {
    try {
      // Validate inputs
      if (!scriptId || scriptId === '') {
        console.error('Invalid script ID provided to saveElements');
        toast({
          title: "Error",
          description: "Cannot save: Invalid script ID",
          variant: "destructive"
        });
        return false;
      }

      // Don't attempt to save if no elements
      if (!elements) {
        console.log("No elements provided to save");
        return true; // Return true as "nothing failed"
      }

      console.log('Saving elements for script ID:', scriptId);
      console.log('Elements to save count:', elements.length);

      // Verify script existence before attempting to save elements
      const { data: scriptExists, error: scriptCheckError } = await supabase
        .from('scripts')
        .select('id')
        .eq('id', scriptId)
        .single();

      if (scriptCheckError || !scriptExists) {
        console.error('Script does not exist, cannot save elements:', scriptCheckError);
        toast({
          title: "Error",
          description: `Failed to save script elements: Script does not exist`,
          variant: "destructive",
        });
        return false;
      }

      // === DIFFERENTIAL UPDATE STRATEGY ===
      // 1. Get all existing element IDs for this script from the DB
      const { data: existingElements, error: fetchError } = await supabase
        .from('script_elements')
        .select('id')
        .eq('script_id', scriptId);

      if (fetchError) {
        console.error('Error fetching existing elements for diff:', fetchError);
        // Fallback or abort? Abort to be safe.
        throw new Error(`Failed to fetch existing elements: ${fetchError.message}`);
      }

      const existingIds = new Set(existingElements?.map(e => e.id) || []);
      const newIds = new Set(elements.map(e => e.id).filter(id => id)); // Filter out potential undefined IDs

      // 2. Identify IDs to DELETE (Present in DB but missing in new elements)
      const idsToDelete = [...existingIds].filter(id => !newIds.has(id));

      if (idsToDelete.length > 0) {
        console.log(`Deleting ${idsToDelete.length} removed elements...`);
        const { error: deleteError } = await supabase
          .from('script_elements')
          .delete()
          .in('id', idsToDelete);

        if (deleteError) {
          console.error('Error deleting removed elements:', deleteError);
          // We continue trying to save the rest, but warn
          toast({
            title: "Warning",
            description: "Some deleted elements could not be removed.",
            variant: "destructive"
          });
        }
      }

      // 3. UPSERT the collected elements (updates existing, inserts new)
      // Fix: Make sure each element has valid content and structure
      const elementsToUpsert = elements.map((element, index) => ({
        script_id: scriptId,
        type: element.type,
        content: element.content || '', // Ensure content is never null
        position: index,
        id: element.id // ID is required for upsert to work as update
      }));

      console.log('Upserting elements:', elementsToUpsert.length);

      // Split elements into smaller batches to avoid potential payload size limits
      const batchSize = 100; // Can increase batch size for upserts
      const batches = [];

      for (let i = 0; i < elementsToUpsert.length; i += batchSize) {
        batches.push(elementsToUpsert.slice(i, i + batchSize));
      }

      // Upsert elements in batches
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];

        const { error: upsertError } = await supabase
          .from('script_elements')
          .upsert(batch, { onConflict: 'id' }); // Important: Upsert based on ID

        if (upsertError) {
          console.error('Error upserting elements in batch:', upsertError);
          toast({
            title: "Error",
            description: `Failed to save script elements batch ${i + 1}: ${upsertError.message}`,
            variant: "destructive",
          });
          return false;
        }
      }

      console.log('All elements synchronized successfully');

      // Clear backup upon successful save
      try {
        localStorage.removeItem(`scriptBackup_${scriptId}`);
        console.log('Removed backup after successful save');
      } catch (e) {
        console.error('Error removing script backup:', e);
      }

      return true;
    } catch (error) {
      console.error('Error in saveElements:', error);
      toast({
        title: "Error",
        description: "Failed to save script elements due to an unexpected error",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    saveElements
  };
};
