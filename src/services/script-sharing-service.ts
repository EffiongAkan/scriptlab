
import { supabase } from "@/integrations/supabase/client";

export interface ShareOptions {
  type: 'link' | 'email' | 'social';
  accessLevel: 'read' | 'comment' | 'edit';
  expiresAt?: Date;
  password?: string;
  allowDownload: boolean;
}

export interface ShareResult {
  success: boolean;
  shareUrl?: string;
  shareToken?: string;
  error?: string;
}

export class ScriptSharingService {
  static async createShareLink(
    scriptId: string,
    options: ShareOptions
  ): Promise<ShareResult> {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      // Create share record in database
      const { data, error } = await supabase
        .from('shared_scripts')
        .insert({
          script_id: scriptId,
          access_level: options.accessLevel,
          expires_at: options.expiresAt?.toISOString(),
          allow_download: options.allowDownload,
          share_type: options.type,
          created_by: user.id
        })
        .select('share_token')
        .single();

      if (error) throw error;

      const shareToken = data.share_token;
      const baseUrl = window.location.origin;
      const shareUrl = `${baseUrl}/share/${shareToken}`;

      return {
        success: true,
        shareUrl,
        shareToken
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create share link'
      };
    }
  }

  static async revokeShareLink(shareToken: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('shared_scripts')
        .delete()
        .eq('share_token', shareToken);

      return !error;
    } catch (error) {
      console.error('Error revoking share link:', error);
      return false;
    }
  }

  static async getActiveShares(scriptId: string): Promise<any[]> {
    try {
      // Fetch all shares for the script
      const { data, error } = await supabase
        .from('shared_scripts')
        .select('*')
        .eq('script_id', scriptId);

      if (error) throw error;

      // Filter expired shares client-side
      const now = new Date();
      const activeShares = (data || []).filter(share => {
        if (!share.expires_at) return true; // No expiration
        const expirationDate = new Date(share.expires_at);
        return expirationDate > now;
      });

      return activeShares;
    } catch (error) {
      console.error('Error getting active shares:', error);
      return [];
    }
  }

  static async getSharedScript(shareToken: string): Promise<any> {
    try {
      console.log('Fetching shared script with token:', shareToken);

      // Step 1: Get share info first (simple query)
      const { data: shareData, error: shareError } = await supabase
        .from('shared_scripts')
        .select('*')
        .eq('share_token', shareToken)
        .single();

      if (shareError) {
        console.error('Error fetching share:', shareError);
        return null;
      }

      if (!shareData) {
        console.error('No share data found for token:', shareToken);
        return null;
      }

      // Check expiration client-side
      if (shareData.expires_at) {
        const expirationDate = new Date(shareData.expires_at);
        const now = new Date();

        console.log('Expiration check:', {
          expiresAt: expirationDate.toISOString(),
          now: now.toISOString(),
          isExpired: expirationDate <= now
        });

        if (expirationDate <= now) {
          console.error('Share link has expired');
          return null;
        }
      }

      console.log('Share data:', shareData);

      // Step 2: Get script info separately
      const { data: scriptData, error: scriptError } = await supabase
        .from('scripts')
        .select('id, title, description, genre, language')
        .eq('id', shareData.script_id)
        .single();

      if (scriptError) {
        console.error('Error fetching script:', scriptError);
        return null;
      }

      console.log('Script data:', scriptData);

      // Step 3: Get script elements separately
      const { data: elementsData, error: elementsError } = await supabase
        .from('script_elements')
        .select('id, type, content, position')
        .eq('script_id', shareData.script_id)
        .order('position', { ascending: true });

      if (elementsError) {
        console.error('Error fetching elements:', elementsError);
        // Continue even if elements fail
      }

      console.log('Elements data:', elementsData?.length || 0, 'elements');

      // Step 4: Update access count
      await supabase
        .from('shared_scripts')
        .update({
          access_count: (shareData.access_count || 0) + 1,
          last_accessed_at: new Date().toISOString()
        })
        .eq('share_token', shareToken);

      // Combine all data
      return {
        script: {
          ...scriptData,
          script_elements: elementsData || []
        },
        shareInfo: {
          access_level: shareData.access_level,
          expires_at: shareData.expires_at,
          allow_download: shareData.allow_download,
          access_count: shareData.access_count,
        }
      };
    } catch (error) {
      console.error('Error getting shared script:', error);
      return null;
    }
  }

  static generateEmailTemplate(shareUrl: string, scriptTitle: string): string {
    return `
Subject: Script Shared: ${scriptTitle}

Hi,

I'd like to share a script with you: "${scriptTitle}"

You can view it here: ${shareUrl}

Best regards
    `.trim();
  }

  static async getComments(scriptId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('script_comments')
        .select(`
          id,
          content,
          created_at,
          guest_name,
          user_id,
          element_id
        `) // Removed profiles join which might be blocking public access
        .eq('script_id', scriptId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  }

  static async addComment(
    scriptId: string,
    content: string,
    elementId: string,
    guestName?: string
  ): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const commentData: any = {
        script_id: scriptId,
        content,
        element_id: elementId,
      };

      if (user) {
        commentData.user_id = user.id;
      } else if (guestName) {
        commentData.guest_name = guestName;
      } else {
        throw new Error("Must provide either user_id or guest_name");
      }

      const { data, error } = await supabase
        .from('script_comments')
        .insert(commentData)
        .select() // Simplified select to avoid join issues on insert
        .single();

      if (error) {
        console.error('Supabase insert error details:', error);
        throw error;
      }
      return { success: true, comment: data };
    } catch (error) {
      console.error('Error adding comment:', error);
      return { success: false, error };
    }
  }

  static copyToClipboard(text: string): Promise<boolean> {
    return navigator.clipboard.writeText(text)
      .then(() => true)
      .catch(() => false);
  }
}
