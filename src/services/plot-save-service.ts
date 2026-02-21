
import { supabase } from "@/integrations/supabase/client";
import { Genre, SubGenre, Language } from "@/types";

// Types for saving plot content
export interface PlotSaveRequest {
  title: string;
  content: string;
  genre?: Genre;
  subGenres?: SubGenre[];
  language?: Language;
  userId: string;
}

export interface PlotSaveResponse {
  id: string;
  success: boolean;
  error?: string;
}

// Function to save plot content to the database
export const savePlotContent = async (request: PlotSaveRequest): Promise<PlotSaveResponse> => {
  try {
    console.log(`Saving plot content with title: ${request.title}`);
    
    const { data, error } = await supabase
      .from('plots')
      .insert({
        title: request.title,
        content: request.content,
        genre: request.genre,
        sub_genres: request.subGenres,
        language: request.language,
        user_id: request.userId
      })
      .select('id')
      .single();
    
    if (error) {
      console.error("Plot save error:", error);
      throw new Error(error.message || 'Failed to save plot content');
    }
    
    return {
      id: data.id,
      success: true
    };
  } catch (error) {
    console.error('Plot save failed:', error);
    return {
      id: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred while saving plot'
    };
  }
};

// Function to update an existing plot
export const updatePlotContent = async (
  plotId: string, 
  request: Omit<PlotSaveRequest, 'userId'>
): Promise<PlotSaveResponse> => {
  try {
    console.log(`Updating plot content with ID: ${plotId}`);
    
    const { data, error } = await supabase
      .from('plots')
      .update({
        title: request.title,
        content: request.content,
        genre: request.genre,
        sub_genres: request.subGenres,
        language: request.language,
        updated_at: new Date().toISOString()
      })
      .eq('id', plotId)
      .select('id')
      .single();
    
    if (error) {
      console.error("Plot update error:", error);
      throw new Error(error.message || 'Failed to update plot content');
    }
    
    return {
      id: plotId,
      success: true
    };
  } catch (error) {
    console.error('Plot update failed:', error);
    return {
      id: plotId,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred while updating plot'
    };
  }
};

// Function to retrieve plot content by id
export const getPlotContent = async (plotId: string) => {
  try {
    const { data, error } = await supabase
      .from('plots')
      .select('*')
      .eq('id', plotId)
      .single();
      
    if (error) {
      console.error("Error fetching plot:", error);
    }
    
    return { data, error };
  } catch (error) {
    console.error('Error in getPlotContent:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

// Function to get all plots for a user
export const getUserPlots = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('plots')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Error fetching user plots:", error);
    }
    
    return { data: data || [], error };
  } catch (error) {
    console.error('Error in getUserPlots:', error);
    return { 
      data: [], 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};
