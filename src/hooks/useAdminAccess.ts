
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useAdminAccess() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          console.log('No authenticated user found');
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        console.log('Checking admin status for user:', user.id);

        // First check if any admin exists at all using the edge function
        const { data: adminExistsData, error: adminExistsError } = await supabase.functions.invoke('admin-operations', {
          body: { operation: 'check_admin_exists' }
        });

        if (adminExistsError) {
          console.error('Error checking if admin exists:', adminExistsError);
          // If we can't check via function, try direct query as fallback
          const { data: directCheck, error: directError } = await supabase
            .from('admin_users')
            .select('id')
            .eq('is_active', true)
            .limit(1);

          if (directError) {
            console.error('Direct admin check also failed:', directError);
            // If all checks fail, assume no admin exists and allow first user to be admin
            setIsAdmin(true);
            setLoading(false);
            return;
          }

          const adminExists = directCheck && directCheck.length > 0;
          console.log('Direct check - Admin exists:', adminExists);

          if (!adminExists) {
            // No admin exists, this user can be the first admin
            setIsAdmin(true);
            setLoading(false);
            return;
          }
        } else {
          const adminExists = adminExistsData?.adminExists;
          console.log('Function check - Admin exists:', adminExists);

          if (!adminExists) {
            // No admin exists, this user can be the first admin
            setIsAdmin(true);
            setLoading(false);
            return;
          }
        }

        // Check if current user is admin
        const { data: userAdminData, error: userAdminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (userAdminError) {
          console.error('Error checking user admin status:', userAdminError);
          // Deny access on error - security first
          setIsAdmin(false);
          setError('Failed to verify admin status. Please try again.');
        } else {
          const isUserAdmin = !!userAdminData;
          console.log('User admin status:', isUserAdmin);
          setIsAdmin(isUserAdmin);

          if (isUserAdmin) {
            // Check if super admin
            const { data: isSuper, error: superError } = await (supabase.rpc as any)('is_super_admin', {
              user_id: user.id
            });
            if (!superError) {
              console.log('User super admin status:', isSuper);
              setIsSuperAdmin(!!isSuper);
            }
          }
        }

      } catch (err) {
        console.error('Error in admin access check:', err);
        // Deny access on error - security first
        setIsAdmin(false);
        setError('An error occurred while checking admin access. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  const createFirstAdmin = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user');
      }

      // Insert admin user - role_id will be auto-assigned by database trigger
      const { error } = await supabase
        .from('admin_users')
        .insert([
          {
            user_id: user.id,
            email: user.email || '',
            role: 'admin',
            is_active: true
          }
        ]);

      if (error) {
        throw error;
      }

      setIsAdmin(true);
      setIsSuperAdmin(true);
      toast({
        title: "Success",
        description: "Super Admin access granted successfully",
      });

      return true;
    } catch (error: any) {
      console.error('Error creating first admin:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create admin access",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    isAdmin,
    isSuperAdmin,
    loading,
    error,
    createFirstAdmin
  };
}
