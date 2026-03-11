
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useAdminAccess() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    canManageUsers: false,
    canManageSubscriptions: false,
    canManageSystem: false,
    canViewAnalytics: false,
    canSendNotifications: false,
    canManageAdmins: false
  });
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

        // Check if any admin exists at all using the edge function
        const { data: adminExistsData, error: adminExistsError } = await supabase.functions.invoke('admin-operations', {
          body: { operation: 'check_admin_exists' }
        });

        if (adminExistsError) {
          console.error('Error checking if admin exists:', adminExistsError);
          // FALLBACK: Security first, don't allow access if check fails
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        const adminExists = adminExistsData?.adminExists;
        console.log('Admin existence check:', adminExists);

        if (!adminExists) {
          // SPECIAL CASE: If no admin exists, only allow specific emails to initialize
          const authorizedEmails = ['uploadakan@gmail.com', 'pelicanink2025@gmail.com'];
          if (user.email && authorizedEmails.includes(user.email)) {
            console.log('First-time setup: Authorized super admin detected');
            setIsAdmin(true);
          } else {
            console.log('No admin exists but user is not authorized for initial setup');
            setIsAdmin(false);
          }
          setLoading(false);
          return;
        }

        // Check if current user is admin in the database and get role details
        const { data: userAdminData, error: userAdminError } = await supabase
          .from('admin_users')
          .select(`
            *,
            admin_roles (
              can_manage_users,
              can_manage_subscriptions,
              can_manage_system,
              can_view_analytics,
              can_send_notifications,
              can_manage_admins
            )
          `)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (userAdminError) {
          console.error('Error checking user admin status:', userAdminError);
          setIsAdmin(false);
          setError('Failed to verify admin status. Please try again.');
        } else {
          const isUserAdmin = !!userAdminData;
          console.log('User admin status:', isUserAdmin);
          setIsAdmin(isUserAdmin);

          if (isUserAdmin && userAdminData.admin_roles) {
            const roles: any = userAdminData.admin_roles;
            setPermissions({
              canManageUsers: roles.can_manage_users || false,
              canManageSubscriptions: roles.can_manage_subscriptions || false,
              canManageSystem: roles.can_manage_system || false,
              canViewAnalytics: roles.can_view_analytics || false,
              canSendNotifications: roles.can_send_notifications || false,
              canManageAdmins: roles.can_manage_admins || false
            });
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
        setIsAdmin(false);
        setError('An error occurred while checking admin access.');
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
    permissions,
    loading,
    error,
    createFirstAdmin
  };
}
