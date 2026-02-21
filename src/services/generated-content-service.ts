
import { supabase } from "@/integrations/supabase/client";

export interface GeneratedContent {
  id: string;
  type: 'synopsis' | 'script' | 'treatment';
  title: string;
  content: string;
  genre?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// Save generated synopsis
export const saveGeneratedSynopsis = async (
  title: string, 
  content: string, 
  userId: string,
  metadata?: Record<string, any>
) => {
  try {
    const { data, error } = await supabase
      .from('synopses')
      .insert([{
        title,
        content,
        user_id: userId,
      }])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error saving synopsis:', error);
    return { success: false, error };
  }
};

// Save generated script metadata (elements are saved separately)
export const saveGeneratedScript = async (
  id: string,
  title: string,
  userId: string,
  genre?: string,
  language?: string
) => {
  try {
    const { data, error } = await supabase
      .from('scripts')
      .insert([{
        id,
        title,
        user_id: userId,
        genre,
        language
      }])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error saving script:', error);
    return { success: false, error };
  }
};

// Get user's generated content for dashboard
export const getUserGeneratedContent = async (userId: string) => {
  try {
    // Get synopses
    const { data: synopses, error: synopsesError } = await supabase
      .from('synopses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (synopsesError) throw synopsesError;

    // Get scripts
    const { data: scripts, error: scriptsError } = await supabase
      .from('scripts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (scriptsError) throw scriptsError;

    return {
      success: true,
      data: {
        synopses: synopses || [],
        scripts: scripts || []
      }
    };
  } catch (error) {
    console.error('Error fetching generated content:', error);
    return { success: false, error };
  }
};

// Enhanced script element parsing for better identification
export const parseScriptElementsAdvanced = (scriptContent: string) => {
  const lines = scriptContent.split('\n');
  const elements = [];
  let position = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    let elementType: 'action' | 'character' | 'dialogue' | 'heading' | 'parenthetical' | 'transition' = 'action';
    let content = line;

    // Enhanced parsing logic for professional screenplay elements
    if (line.match(/^(FADE IN:|FADE OUT\.|THE END)$/i)) {
      elementType = 'transition';
    } else if (line.match(/^(INT\.|EXT\.)/i)) {
      elementType = 'heading';
    } else if (line.match(/^[A-Z][A-Z\s\-\.\']+$/) && 
               line.length < 50 && 
               !line.includes('.') && 
               i < lines.length - 1) {
      // Check if next non-empty line is dialogue or parenthetical
      const nextLineIndex = lines.findIndex((l, idx) => idx > i && l.trim());
      if (nextLineIndex !== -1) {
        const nextLine = lines[nextLineIndex].trim();
        if (!nextLine.match(/^[A-Z][A-Z\s\-\.\']+$/) && !nextLine.match(/^(INT\.|EXT\.)/i)) {
          elementType = 'character';
        }
      }
    } else if (line.startsWith('(') && line.endsWith(')')) {
      elementType = 'parenthetical';
    } else if (line.match(/^(CUT TO:|DISSOLVE TO:|FADE TO:|SMASH CUT TO:|MATCH CUT TO:)/i)) {
      elementType = 'transition';
    } else if (i > 0) {
      // Check if previous element was a character name
      const prevElement = elements[elements.length - 1];
      if (prevElement && prevElement.type === 'character' && 
          !line.startsWith('(') && 
          !line.match(/^[A-Z][A-Z\s\-\.\']+$/)) {
        elementType = 'dialogue';
      }
    }

    elements.push({
      type: elementType,
      content: content,
      position: position++
    });
  }

  return elements;
};
