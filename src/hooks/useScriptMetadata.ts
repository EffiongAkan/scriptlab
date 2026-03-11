
/**
 * Hook for managing script metadata operations
 */
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useScriptMetadata = () => {
  const { toast } = useToast();

  /**
   * Creates a new script or updates an existing script's metadata
   * @param scriptId - The script ID
   * @param userId - The user ID
   * @param title - The script title
   * @returns Promise with boolean success status
   */
  const saveScriptMetadata = async (
    scriptId: string,
    userId: string,
    title: string,
    treatment?: string
  ): Promise<boolean> => {
    try {
      console.log('Saving script metadata for ID:', scriptId);
      console.log('Saving title:', title);

      // Check if script exists
      const { data: scriptData, error: scriptCheckError } = await supabase
        .from('scripts')
        .select('id, title')
        .eq('id', scriptId)
        .maybeSingle();

      if (scriptCheckError) {
        console.error('Error checking script existence:', scriptCheckError);
        return false;
      }

      // If script exists, update it
      if (scriptData) {
        console.log('Updating existing script title to:', title);
        const updatePayload: any = { title };
        if (treatment !== undefined) {
          updatePayload.treatment = treatment;
        }

        const { error: updateError } = await supabase
          .from('scripts')
          .update(updatePayload)
          .eq('id', scriptId);

        if (updateError) {
          console.error('Error updating script title:', updateError);
          toast({
            title: "Error",
            description: `Failed to update script title: ${updateError.message}`,
            variant: "destructive",
          });
          return false;
        }
        return true;
      }
      // If script doesn't exist, create it
      else {
        console.log('Creating new script with ID:', scriptId);
        const insertPayload: any = {
          id: scriptId,
          title: title || 'Untitled Script',
          user_id: userId
        };

        if (treatment !== undefined) {
          insertPayload.treatment = treatment;
        }

        const { error: createError } = await supabase
          .from('scripts')
          .insert(insertPayload);

        if (createError) {
          console.error('Error creating script:', createError);
          toast({
            title: "Error",
            description: `Failed to create script: ${createError.message}`,
            variant: "destructive",
          });
          return false;
        }
        return true;
      }
    } catch (error) {
      console.error('Error in saveScriptMetadata:', error);
      return false;
    }
  };

  return {
    saveScriptMetadata
  };
};
