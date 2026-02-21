
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Collaborator } from '@/types/collaboration';
import { useToast } from '@/hooks/use-toast';
import { isValidUuid } from '@/utils/validationUtils';

export const useCollaborators = (scriptId: string) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<{ [key: string]: Collaborator[] }>({});

  // Memoized collaborator fetching function
  const fetchCollaborators = useCallback(async (scriptId: string) => {
    // Check cache first
    if (cacheRef.current[scriptId]) {
      console.log('Using cached collaborators for script:', scriptId);
      setCollaborators(cacheRef.current[scriptId]);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      
      if (!isValidUuid(scriptId)) {
        console.log('Invalid scriptId format:', scriptId);
        setCollaborators([]);
        cacheRef.current[scriptId] = [];
        setIsLoading(false);
        return;
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      // Query collaborators with safe profile data
      const { data, error } = await supabase
        .from('script_collaborators')
        .select(`
          user_id,
          profiles:user_id(
            id,
            username,
            full_name,
            email
          )
        `)
        .eq('script_id', scriptId)
        .abortSignal(abortControllerRef.current.signal);
          
      if (error) {
        throw error;
      }
      
      const formattedCollaborators: Collaborator[] = data?.map((item: any) => {
        const profile = item.profiles;
        return {
          id: profile.id,
          email: profile.email || '',
          username: profile.username || profile.email?.split('@')[0] || 'Unknown User',
          status: 'offline' as const,
        };
      }) || [];
      
      // Cache the results
      cacheRef.current[scriptId] = formattedCollaborators;
      setCollaborators(formattedCollaborators);
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Collaborator fetch aborted');
        return;
      }
      
      console.error('Error loading collaborators:', error);
      setError(error.message || 'Failed to load collaborators');
      
      // Set empty array on error to prevent blocking UI
      setCollaborators([]);
      cacheRef.current[scriptId] = [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Optimized effect with dependency management
  useEffect(() => {
    if (!scriptId) {
      console.log('No scriptId provided to useCollaborators');
      setCollaborators([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetchCollaborators(scriptId);

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [scriptId, fetchCollaborators]);

  // Clear cache when component unmounts
  useEffect(() => {
    return () => {
      // Clear cache for this script when unmounting
      if (scriptId && cacheRef.current[scriptId]) {
        delete cacheRef.current[scriptId];
      }
    };
  }, [scriptId]);

  // Method to refresh collaborators
  const refreshCollaborators = useCallback(() => {
    if (scriptId) {
      // Clear cache for this script
      delete cacheRef.current[scriptId];
      setIsLoading(true);
      fetchCollaborators(scriptId);
    }
  }, [scriptId, fetchCollaborators]);

  // Method to add collaborator optimistically
  const addCollaboratorOptimistic = useCallback((newCollaborator: Collaborator) => {
    setCollaborators(prev => {
      const updated = [...prev, newCollaborator];
      if (scriptId) {
        cacheRef.current[scriptId] = updated;
      }
      return updated;
    });
  }, [scriptId]);

  return { 
    collaborators, 
    setCollaborators, 
    isLoading, 
    error,
    refreshCollaborators,
    addCollaboratorOptimistic
  };
};
