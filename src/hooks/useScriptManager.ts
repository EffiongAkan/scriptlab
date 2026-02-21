
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ScriptElementType } from '@/hooks/useScriptContent';

export const useScriptManager = (scriptId: string) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { toast } = useToast();
  
  // Function to save script content
  const saveScript = async (elements: ScriptElementType[], title: string) => {
    if (!scriptId) {
      toast({
        title: "Error",
        description: "Missing script ID. Cannot save.",
        variant: "destructive"
      });
      return false;
    }
    
    try {
      setIsSaving(true);
      console.log(`Saving script ${scriptId} with ${elements.length} elements`);
      
      // First, check if script exists
      const { data: scriptExists, error: scriptCheckError } = await supabase
        .from('scripts')
        .select('id')
        .eq('id', scriptId)
        .maybeSingle();
      
      if (scriptCheckError) {
        console.error("Error checking script:", scriptCheckError);
        throw new Error(scriptCheckError.message);
      }
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Authentication required');
      }
      
      // Update or create script
      if (!scriptExists) {
        const { error: createError } = await supabase
          .from('scripts')
          .insert({
            id: scriptId,
            title,
            user_id: user.id
          });
          
        if (createError) throw new Error(createError.message);
      } else {
        // Update script title
        const { error: updateError } = await supabase
          .from('scripts')
          .update({ 
            title,
            updated_at: new Date().toISOString()
          })
          .eq('id', scriptId);
          
        if (updateError) throw new Error(updateError.message);
      }
      
      // Clear existing elements
      const { error: deleteError } = await supabase
        .from('script_elements')
        .delete()
        .eq('script_id', scriptId);
        
      if (deleteError) throw new Error(deleteError.message);
      
      // Insert new elements
      if (elements.length > 0) {
        const elementsToInsert = elements.map((element, index) => ({
          script_id: scriptId,
          type: element.type,
          content: element.content || '',
          position: index,
          id: element.id
        }));
        
        const { error: insertError } = await supabase
          .from('script_elements')
          .insert(elementsToInsert);
          
        if (insertError) throw new Error(insertError.message);
      }
      
      // Update last saved timestamp
      setLastSaved(new Date());
      
      toast({
        title: "Success",
        description: "Script saved successfully"
      });
      
      return true;
    } catch (error) {
      console.error('Script save error:', error);
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };
  
  // Function to load script content
  const loadScript = async () => {
    if (!scriptId) return { elements: [], title: '', error: 'Missing script ID' };
    
    try {
      setIsLoading(true);
      console.log(`Loading script ${scriptId}`);
      
      // Get script metadata
      const { data: scriptData, error: scriptError } = await supabase
        .from('scripts')
        .select('*')
        .eq('id', scriptId)
        .maybeSingle();
        
      if (scriptError && scriptError.code !== 'PGRST116') {
        throw new Error(scriptError.message);
      }
      
      // Get script elements
      const { data: elementsData, error: elementsError } = await supabase
        .from('script_elements')
        .select('*')
        .eq('script_id', scriptId)
        .order('position', { ascending: true });
        
      if (elementsError) {
        throw new Error(elementsError.message);
      }
      
      // Format elements
      const elements = elementsData ? elementsData.map(item => ({
        id: item.id,
        type: item.type,
        content: item.content || '',
        position: item.position
      })) : [];
      
      return { 
        elements, 
        title: scriptData?.title || 'Untitled Script',
        error: null
      };
    } catch (error) {
      console.error('Script load error:', error);
      toast({
        title: "Load failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
      return { elements: [], title: '', error: error instanceof Error ? error.message : 'Unknown error occurred' };
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    saveScript,
    loadScript,
    isLoading,
    isSaving,
    lastSaved
  };
};
