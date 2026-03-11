
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export interface ScriptElementType {
  id: string;
  type: 'heading' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition';
  content: string;
  position: number;
  script_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ScriptData {
  id: string;
  title: string;
  description?: string;
  genre?: string;
  language?: string;
  script_type?: string;
  film_industry?: string;
  treatment?: string;
}

export const useScriptContent = (scriptId: string) => {
  const [elements, setElements] = useState<ScriptElementType[]>([]);
  const [scriptData, setScriptData] = useState<ScriptData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load script elements from database
  const loadElements = useCallback(async () => {
    if (!scriptId) return;

    try {
      console.log('Loading script elements for:', scriptId);

      // Load script data
      const { data: script, error: scriptError } = await supabase
        .from('scripts')
        .select('*')
        .eq('id', scriptId)
        .maybeSingle();

      if (scriptError) {
        console.error('Error loading script data:', scriptError);
        setLoadError(scriptError.message);
        return;
      }

      if (script) {
        setScriptData(script);
      }

      let allData: ScriptElementType[] = [];
      let page = 0;
      const CHUNK_SIZE = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('script_elements')
          .select('*')
          .eq('script_id', scriptId)
          .order('position', { ascending: true })
          .range(page * CHUNK_SIZE, (page + 1) * CHUNK_SIZE - 1);

        if (error) {
          console.error('Error loading script elements:', error);
          setLoadError(error.message);
          return;
        }

        if (data) {
          allData = [...allData, ...data];
          if (data.length < CHUNK_SIZE) {
            hasMore = false;
          } else {
            page++;
          }
        } else {
          hasMore = false;
        }
      }

      console.log(`Loaded total ${allData.length} elements`);
      setElements(allData);
    } catch (error) {
      console.error('Unexpected error loading elements:', error);
      setLoadError('Failed to load script content');
    } finally {
      setIsLoaded(true);
    }
  }, [scriptId]);

  // Add a new element
  const addElement = useCallback(async (type: ScriptElementType['type'], content: string = '') => {
    const newElement: ScriptElementType = {
      id: uuidv4(),
      type,
      content,
      position: elements.length,
      script_id: scriptId
    };

    try {
      const { error } = await supabase
        .from('script_elements')
        .insert(newElement);

      if (error) {
        console.error('Error adding element:', error);
        return;
      }

      setElements(prev => [...prev, newElement]);
      return newElement;
    } catch (error) {
      console.error('Error adding element:', error);
    }
  }, [elements.length, scriptId]);

  // Update an element - fix to accept content string directly
  const updateElement = useCallback(async (id: string, contentOrUpdates: string | Partial<ScriptElementType>) => {
    try {
      const updates = typeof contentOrUpdates === 'string'
        ? { content: contentOrUpdates }
        : contentOrUpdates;

      const { error } = await supabase
        .from('script_elements')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating element:', error);
        return;
      }

      setElements(prev =>
        prev.map(el => el.id === id ? { ...el, ...updates } : el)
      );
    } catch (error) {
      console.error('Error updating element:', error);
    }
  }, []);

  // Delete an element
  const deleteElement = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('script_elements')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting element:', error);
        return;
      }

      setElements(prev => prev.filter(el => el.id !== id));
    } catch (error) {
      console.error('Error deleting element:', error);
    }
  }, []);

  // Batch Delete elements
  const deleteElements = useCallback(async (ids: string[]) => {
    if (!ids || ids.length === 0) return;

    try {
      console.log(`Batch deleting ${ids.length} elements...`);
      const { error } = await supabase
        .from('script_elements')
        .delete()
        .in('id', ids);

      if (error) {
        console.error('Error batch deleting elements:', error);
        return;
      }

      // Optimistic update
      setElements(prev => prev.filter(el => !ids.includes(el.id)));
      console.log('Batch delete successful');
    } catch (error) {
      console.error('Error in batch delete:', error);
    }
  }, []);

  // Reorder elements
  const reorderElements = useCallback(async (reorderedElements: ScriptElementType[]) => {
    // Optimistically update local state
    setElements(reorderedElements);

    try {
      const elementIds = reorderedElements.map(el => el.id);

      // Call atomic RPC function to update all positions in a single transaction
      const { error } = await supabase.rpc('reorder_script_elements_atomic', {
        p_script_id: scriptId,
        p_element_ids: elementIds
      });

      if (error) {
        console.error('Error reordering elements via RPC:', error);
        // Fallback removed because individual updates violate deferrable UNIQUE constraint
        // when run without a transaction. Rely on RPC or explicit reload.
        loadElements();
      }
    } catch (error) {
      console.error('Error reordering elements:', error);
      loadElements();
    }
  }, [scriptId, loadElements]);

  // Change element type
  const changeElementType = useCallback(async (id: string, newType: ScriptElementType['type']) => {
    try {
      const element = elements.find(el => el.id === id);
      if (!element) {
        console.error('Element not found:', id);
        return;
      }

      // Update in database
      const { error } = await supabase
        .from('script_elements')
        .update({ type: newType })
        .eq('id', id);

      if (error) {
        console.error('Error changing element type:', error);
        return;
      }

      // Update local state
      setElements(prev =>
        prev.map(el => el.id === id ? { ...el, type: newType } : el)
      );

      console.log(`Changed element ${id} from ${element.type} to ${newType}`);
    } catch (error) {
      console.error('Error changing element type:', error);
    }
  }, [elements]);

  // Load elements on mount
  useEffect(() => {
    loadElements();
  }, [loadElements]);

  return {
    elements,
    scriptData,
    isLoaded,
    loadError,
    addElement,
    updateElement,
    deleteElement,
    deleteElements,
    reorderElements,
    changeElementType,
    reloadElements: loadElements
  };
};
