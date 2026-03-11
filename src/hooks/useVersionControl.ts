import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ScriptElement } from '@/types/script';
import { useAuth } from '@/integrations/supabase/auth';

export interface ScriptVersion {
    id: string;
    script_id: string;
    version_number: string;
    created_at: string;
    commit_message: string;
    content_snapshot: ScriptElement[];
    branch: string;
    created_by: string;
    author?: {
        name: string;
    };
}

export function useVersionControl(scriptId: string) {
    const [versions, setVersions] = useState<ScriptVersion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();

    const fetchVersions = useCallback(async () => {
        if (!scriptId) return;

        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('script_versions')
                .select(`
          *,
          author:profiles!created_by(id, full_name)
        `)
                .eq('script_id', scriptId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transform author formatting
            const formattedVersions = (data as any[]).map(v => ({
                ...v,
                author: {
                    name: v.author?.full_name || 'Unknown User'
                }
            }));

            setVersions(formattedVersions);
        } catch (error: any) {
            console.error('Error fetching versions:', error);
            toast({
                title: "Error fetching versions",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }, [scriptId, toast]);

    const saveVersion = async (elements: ScriptElement[], commitMessage: string, versionNumber: string, branch = 'main') => {
        if (!scriptId || !user) return false;

        try {
            const { error } = await supabase
                .from('script_versions')
                .insert({
                    script_id: scriptId,
                    version_number: versionNumber,
                    commit_message: commitMessage,
                    content_snapshot: elements,
                    branch,
                    created_by: user.id
                });

            if (error) throw error;

            toast({
                title: "Version saved",
                description: `Successfully created version ${versionNumber}`,
            });

            await fetchVersions();
            return true;
        } catch (error: any) {
            console.error('Error saving version:', error);
            toast({
                title: "Error saving version",
                description: error.message,
                variant: "destructive"
            });
            return false;
        }
    };

    const restoreVersion = async (versionId: string) => {
        const version = versions.find(v => v.id === versionId);
        if (!version || !scriptId) return false;

        try {
            // OVERWRITE CURRENT SCRIPT
            const { error } = await supabase
                .from('scripts')
                .update({
                    content: version.content_snapshot,
                    updated_at: new Date().toISOString()
                })
                .eq('id', scriptId);

            if (error) throw error;

            toast({
                title: "Version restored",
                description: `Successfully restored script to version ${version.version_number}`,
            });

            return true;
        } catch (error: any) {
            console.error('Error restoring version:', error);
            toast({
                title: "Error restoring version",
                description: error.message,
                variant: "destructive"
            });
            return false;
        }
    };

    return {
        versions,
        isLoading,
        fetchVersions,
        saveVersion,
        restoreVersion
    };
}
