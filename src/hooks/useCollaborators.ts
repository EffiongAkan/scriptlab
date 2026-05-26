
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

      // Query collaborators first
      const { data: collaboratorsData, error: collabError } = await supabase
        .from('script_collaborators')
        .select('user_id')
        .eq('script_id', scriptId)
        .abortSignal(abortControllerRef.current.signal);
          
      if (collabError) {
        throw collabError;
      }
      
      let formattedCollaborators: Collaborator[] = [];
      
      if (collaboratorsData && collaboratorsData.length > 0) {
        const userIds = collaboratorsData.map(c => c.user_id);
        
        // Then fetch their profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, full_name, email')
          .in('id', userIds)
          .abortSignal(abortControllerRef.current.signal);
          
        if (profilesError) {
          console.warn('Failed to load some collaborator profiles', profilesError);
        }
        
        formattedCollaborators = profilesData?.map(profile => ({
          id: profile.id,
          email: profile.email || '',
          username: profile.username || profile.email?.split('@')[0] || 'Unknown User',
          status: 'offline' as const,
        })) || [];
      }

      
      // Cache the results
      cacheRef.current[scriptId] = formattedCollaborators;
      setCollaborators(formattedCollaborators);
      
    } catch (error: any) {
      const errorStr = typeof error === 'string' ? error : JSON.stringify(error) + (error?.message || '') + (error?.details || '') + (error?.name || '');
      const isAbortError = errorStr.includes('AbortError') || errorStr.includes('aborted');

      if (isAbortError) {
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
