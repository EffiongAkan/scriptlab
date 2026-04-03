import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  CreditCard,
  Settings,
  AlertCircle,
  CheckCircle,
  Shield,
  Activity,
  TrendingUp,
  DollarSign,
  Zap,
  Crown,
  BarChart3,
  Mail,
  Server,
  Bell,
  UserPlus,
  LayoutGrid,
  List,
  SortAsc,
  ArrowUpDown,
  Trash2,
  Pause,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AdminAccessGate } from '@/components/admin/AdminAccessGate';
import { DetailedUserCard } from '@/components/admin/DetailedUserCard';
import { SubscriptionPlanManager } from '@/components/admin/SubscriptionPlanManager';
import { NotificationManager } from '@/components/admin/NotificationManager';
import { AdminLevelManager } from '@/components/admin/AdminLevelManager';
import { AdminInvitationManager } from '@/components/admin/AdminInvitationManager';
import { AdminSubscriptionPlan } from '../types/admin';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { AIModelSelector } from '@/components/admin/AIModelSelector';
import GlobalCacheMonitor from '@/components/admin/GlobalCacheMonitor';
import { SystemSettingsManager } from '@/components/admin/SystemSettingsManager';

import { SUBSCRIPTION_PLANS } from '@/constants/subscriptionPlans';

interface DetailedUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
  profile?: {
    username?: string;
    full_name?: string;
    avatar_url?: string;
    ai_credits?: number;
  };
  subscription?: {
    tier?: string;
    status?: string;
    ends_at?: string;
  };
  activity?: {
    scripts_count: number;
    last_active: string;
    total_ai_usage: number;
  };
  status: 'active' | 'paused' | 'banned';
}

interface SystemHealth {
  database_status: 'healthy' | 'warning' | 'error';
  api_status: 'healthy' | 'warning' | 'error';
  edge_functions_status: 'healthy' | 'warning' | 'error';
  storage_status: 'healthy' | 'warning' | 'error';
}


export default function AdminDashboard() {
  const { toast } = useToast();
  const { isSuperAdmin, permissions, loading: accessLoading } = useAdminAccess();
  const [users, setUsers] = useState<DetailedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [systemSettings, setSystemSettings] = useState<Record<string, any>>({});
  const [apiKeyStatuses, setApiKeyStatuses] = useState<Record<string, boolean>>({});
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database_status: 'healthy',
    api_status: 'healthy',
    edge_functions_status: 'healthy',
    storage_status: 'healthy'
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalCredits: 0,
    totalRevenue: 39.96,
    totalScripts: 0,
    totalSubscriptions: 0,
    monthlyActiveUsers: 0,
    conversionRate: 0
  });

  // Map shared plans to admin-compatible format
  const [subscriptionPlans, setSubscriptionPlans] = useState<AdminSubscriptionPlan[]>([]);

  // User Tab Management
  const [userSortBy, setUserSortBy] = useState<'email' | 'newest' | 'oldest' | 'credits' | 'scripts'>('newest');
  const [userViewMode, setUserViewMode] = useState<'grid' | 'list'>('grid');

  const fetchSubscriptionPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans' as any)
        .select('*')
        .order('monthly_price', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setSubscriptionPlans((data as any[]).map(plan => ({
          id: plan.id,
          name: plan.name,
          description: plan.description,
          price: Number(plan.monthly_price),
          interval: 'month',
          features: plan.features || [],
          limits: {
            scripts: plan.limits?.scripts || 0,
            aiGenerations: plan.limits?.aiCreditsPerMonth || 0,
            collaborators: plan.limits?.collaborators || 0,
            exports: plan.limits?.exports || 0
          },
          isActive: plan.is_active,
          subscriberCount: 0 // Will be handled by global stats if needed
        })));
      } else {
        // Fallback to constants if DB is empty
        setSubscriptionPlans(SUBSCRIPTION_PLANS.map(plan => ({
          id: plan.id,
          name: plan.name,
          description: plan.description,
          price: plan.monthlyPrice,
          interval: 'month',
          features: plan.features,
          limits: { ...plan.limits, aiGenerations: plan.limits.aiCreditsPerMonth },
          isActive: true,
          subscriberCount: 0
        })));
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({ title: "Error", description: "Failed to load subscription plans", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchSystemStats();
    fetchSubscriptionPlans();
  }, []);

  const [notificationTemplates, setNotificationTemplates] = useState<any[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<any[]>([]);

  const fetchNotificationData = async () => {
    try {
      const { data: templates, error: templatesError } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'notification_templates')
        .maybeSingle();

      if (templates?.value) {
        setNotificationTemplates(templates.value as any[]);
      }
      console.log('Fetching notification history directly from DB (RLS)...');
      const { data: notifications, error } = await supabase
        .from('notifications' as any)
        .select('*')
        .eq('type', 'system')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      const history = notifications || [];
      
      // Group by send event (grouping by time window and subject)
      const grouped = (history as any[]).reduce((acc: any[], current) => {
        const currentTimestamp = current.created_at ? new Date(current.created_at).getTime() : Date.now();
        
        // Find existing group with same subject sent within 5 seconds
        const existing = acc.find(item => 
          item.subject === current.title && 
          Math.abs(new Date(item.sent_at).getTime() - currentTimestamp) < 5000
        );

        if (existing) {
          existing.recipients = (existing.recipients || 1) + 1;
          existing.type = 'bulk';
        } else {
          acc.push({
            id: current.id,
            subject: current.title,
            message: current.message,
            sent_at: current.created_at,
            status: 'sent',
            recipients: 1,
            type: 'individual'
          });
        }
        return acc;
      }, []);

      setNotificationHistory(grouped);
    } catch (error) {
      console.error('Error fetching notification data:', error);
    }
  };

  const handleSaveTemplate = async (template: any) => {
    try {
      const newTemplates = [...notificationTemplates, { ...template, id: crypto.randomUUID() }];
      const { error } = await supabase
        .from('system_settings')
        .update({ value: newTemplates })
        .eq('key', 'notification_templates');

      if (error) throw error;
      setNotificationTemplates(newTemplates);
      toast({ title: "Success", description: "Template saved" });
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const [adminRoles, setAdminRoles] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);

  const fetchAdminRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_roles' as any)
        .select('*')
        .order('level', { ascending: false });

      if (error) throw error;

      const mappedRoles = (data || []).map((role: any) => ({
        ...role,
        canManageUsers: role.can_manage_users,
        canManageSubscriptions: role.can_manage_subscriptions,
        canManageSystem: role.can_manage_system,
        canViewAnalytics: role.can_view_analytics,
        canSendNotifications: role.can_send_notifications,
        canManageAdmins: role.can_manage_admins
      }));

      setAdminRoles(mappedRoles);
    } catch (error: any) {
      console.error('Error fetching admin roles:', error);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select(`
          *,
          role:admin_roles(name, level)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdminUsers(data || []);
    } catch (error: any) {
      console.error('Error fetching admin users:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session');
      }

      const response = await supabase.functions.invoke('admin-operations', {
        body: { operation: 'list_users' }
      });

      if (response.error) {
        throw response.error;
      }

      const userData = response.data?.users || [];

      // Transform to detailed user format
      const detailedUsers: DetailedUser[] = userData.map((user: any) => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        profile: {
          username: user.profile?.username || user.user_metadata?.username,
          full_name: user.profile?.full_name || user.user_metadata?.full_name,
          avatar_url: user.profile?.avatar_url || user.user_metadata?.avatar_url,
          ai_credits: user.profile?.ai_credits ?? 0
        },
        activity: {
          scripts_count: user.stats?.scripts_count || 0,
          last_active: user.last_sign_in_at || user.created_at,
          total_ai_usage: user.stats?.total_ai_usage || 0
        },
        status: user.last_sign_in_at ? 'active' : 'paused'
      }));

      setUsers(detailedUsers);

      setStats(prev => ({
        ...prev,
        totalUsers: detailedUsers.length,
        activeUsers: detailedUsers.filter(u => u.last_sign_in_at).length
      }));

    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sortedUsers = React.useMemo(() => {
    return [...users].sort((a, b) => {
      switch (userSortBy) {
        case 'email':
          return a.email.localeCompare(b.email);
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'credits':
          return (b.profile?.ai_credits || 0) - (a.profile?.ai_credits || 0);
        case 'scripts':
          return (b.activity?.scripts_count || 0) - (a.activity?.scripts_count || 0);
        default:
          return 0;
      }
    });
  }, [users, userSortBy]);

  const fetchSystemStats = async () => {
    try {
      // Fetch comprehensive system statistics
      const [scriptsResponse, subscriptionsResponse, creditsResponse] = await Promise.all([
        supabase.from('scripts').select('id', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('ai_credits')
      ]);

      let totalCredits = 0;
      if (creditsResponse.data) {
        totalCredits = creditsResponse.data.reduce((sum, profile) => sum + (profile.ai_credits || 0), 0);
      }

      setStats(prev => ({
        ...prev,
        totalCredits,
        totalScripts: scriptsResponse.count || 0,
        totalSubscriptions: subscriptionsResponse.count || 0,
        totalRevenue: 39.96, // Fixed revenue placeholder for now as it needs a business table
        conversionRate: prev.totalUsers > 0 ? ((subscriptionsResponse.count || 0) / prev.totalUsers * 100) : 0
      }));

    } catch (error) {
      console.error('Error fetching system stats:', error);
    }
  };

  const fetchSystemSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');

      if (error) throw error;

      const settingsMap: Record<string, any> = {};
      data?.forEach(setting => {
        settingsMap[setting.key] = setting.value;
      });
      setSystemSettings(settingsMap);

    } catch (error) {
      console.error('Error fetching system settings:', error);
    }
  };

  const checkSystemHealth = async () => {
    try {
      // Check database connectivity
      const { error: dbError } = await supabase.from('profiles').select('id').limit(1);

      // Check edge functions
      const { error: functionError } = await supabase.functions.invoke('admin-operations', {
        body: { operation: 'health_check' }
      });

      setSystemHealth({
        database_status: dbError ? 'error' : 'healthy',
        api_status: 'healthy', // Assuming API is healthy if we can make requests
        edge_functions_status: functionError ? 'warning' : 'healthy',
        storage_status: 'healthy' // Would need actual storage check
      });

    } catch (error) {
      console.error('Error checking system health:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchAdminRoles();
    fetchAdminUsers();
    fetchSystemStats();
    fetchSystemSettings();
    fetchNotificationData();
    checkSystemHealth();

    // Set up real-time subscriptions for auto-refresh
    let timeoutId: NodeJS.Timeout;

    const debouncedRefresh = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fetchUsers();
        fetchSystemStats();
        fetchNotificationData();
      }, 1000); // Debounce to prevent rapid-fire requests
    };

    const channel = supabase.channel('admin_dashboard_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, debouncedRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scripts' }, debouncedRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions' }, debouncedRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'credit_transactions' }, debouncedRefresh)
      .subscribe();

    return () => {
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
      if (updates.ai_credits !== undefined) {
        const response = await supabase.functions.invoke('admin-operations', {
          body: {
            operation: 'update_user_credits',
            data: { userId, credits: updates.ai_credits }
          }
        });

        if (response.error) {
          throw response.error;
        }
      }

      // Update local state
      setUsers(prev => prev.map(user =>
        user.id === userId
          ? { ...user, ...updates, profile: { ...user.profile, ...updates } }
          : user
      ));

      toast({
        title: "Success",
        description: "User updated successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await supabase.functions.invoke('admin-operations', {
        body: {
          operation: 'delete_user',
          data: { userId }
        }
      });

      if (response.error) {
        throw response.error;
      }

      setUsers(prev => prev.filter(user => user.id !== userId));

      toast({
        title: "Success",
        description: "User deleted successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive"
      });
    }
  };

  const handleSendNotification = async (data: any) => {
    try {
      const { recipients, subject, message, notificationType, actionUrl } = data;
      
      // 1. In-App Notifications: Insert directly to bypass potential Edge Function latency/issues
      if (notificationType === 'in-app' || notificationType === 'both') {
        const notificationEntries = recipients.map((recipientId: string) => ({
          user_id: recipientId,
          title: subject,
          message: message,
          type: 'system', // CRITICAL: Must be 'system' for history and bell visibility
          action_url: actionUrl || null,
          read: false
        }));

        const { error: insertError } = await supabase
          .from('notifications' as any)
          .insert(notificationEntries);

        if (insertError) throw insertError;
      }

      // 2. Email Notifications: Still needs Edge Function
      if (notificationType === 'email' || notificationType === 'both') {
        const response = await supabase.functions.invoke('admin-operations', {
          body: {
            operation: 'send_notification',
            data: { ...data, notificationType: 'email' } // Force only email in edge function
          }
        });

        if (response.error) {
          throw response.error;
        }
      }

      toast({
        title: "Success",
        description: "Notification sent successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send notification",
        variant: "destructive"
      });
    }
  };

  const handleUpdateSetting = async (key: string, value: any) => {
    try {
      console.log(`[Direct Update] Saving ${key}...`, value);

      // Get current user for updated_by
      const { data: { user } } = await supabase.auth.getUser();

      // Direct DB update to bypass Edge Function issues
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key,
          value, // Supabase JS client handles JSONB correctly
          updated_by: user?.id
        }, { onConflict: 'key' });

      if (error) {
        console.error('[Direct Update] Failed:', error);
        throw error;
      }

      console.log('[Direct Update] Success for', key);

      // Update local state
      setSystemSettings(prev => ({ ...prev, [key]: value }));
    } catch (error: any) {
      console.error('Error updating system setting:', error);
      throw error;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertCircle className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };


  return (
    <AdminAccessGate>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>

        {/* System Health Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <div className={getStatusColor(systemHealth.database_status)}>
                  {getStatusIcon(systemHealth.database_status)}
                </div>
                <span>Database</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={getStatusColor(systemHealth.api_status)}>
                  {getStatusIcon(systemHealth.api_status)}
                </div>
                <span>API</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={getStatusColor(systemHealth.edge_functions_status)}>
                  {getStatusIcon(systemHealth.edge_functions_status)}
                </div>
                <span>Functions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={getStatusColor(systemHealth.storage_status)}>
                  {getStatusIcon(systemHealth.storage_status)}
                </div>
                <span>Storage</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeUsers} active users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Credits</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCredits}</div>
              <p className="text-xs text-muted-foreground">
                Total credits in system
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSubscriptions}</div>
              <p className="text-xs text-muted-foreground">
                {stats.conversionRate.toFixed(1)}% conversion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue}</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs
          defaultValue={
            isSuperAdmin || permissions.canManageUsers ? "users" :
              (permissions.canManageSubscriptions ? "subscriptions" :
                (permissions.canSendNotifications ? "notifications" :
                  (permissions.canManageAdmins ? "admins" :
                    (permissions.canViewAnalytics ? "analytics" :
                      (permissions.canManageSystem ? "system" : "")))))
          }
          className="space-y-4"
        >
          <div className="overflow-x-auto -mx-2 px-2">
            <TabsList className="inline-flex w-auto min-w-full md:grid md:grid-cols-9 h-auto flex-wrap md:flex-nowrap gap-1">
              {(isSuperAdmin || permissions.canManageUsers) && (
                <TabsTrigger value="users" className="text-xs whitespace-nowrap">Users</TabsTrigger>
              )}
              {(isSuperAdmin || permissions.canManageSubscriptions) && (
                <TabsTrigger value="subscriptions" className="text-xs whitespace-nowrap">Plans</TabsTrigger>
              )}
              {(isSuperAdmin || permissions.canSendNotifications) && (
                <TabsTrigger value="notifications" className="text-xs whitespace-nowrap">Notifications</TabsTrigger>
              )}
              {(isSuperAdmin || permissions.canManageAdmins) && (
                <TabsTrigger value="admins" className="text-xs whitespace-nowrap">Admin Levels</TabsTrigger>
              )}
              {(isSuperAdmin || permissions.canViewAnalytics) && (
                <TabsTrigger value="analytics" className="text-xs whitespace-nowrap">Analytics</TabsTrigger>
              )}
              {(isSuperAdmin || permissions.canManageAdmins) && (
                <TabsTrigger value="invites" className="text-xs whitespace-nowrap">Admin Invites</TabsTrigger>
              )}
              {(isSuperAdmin || permissions.canManageSystem) && (
                <TabsTrigger value="ai-cache" className="text-xs whitespace-nowrap">AI Cache</TabsTrigger>
              )}
              {(isSuperAdmin || permissions.canManageSystem) && (
                <TabsTrigger value="system" className="text-xs whitespace-nowrap">System</TabsTrigger>
              )}
              {(isSuperAdmin || permissions.canManageSystem) && (
                <TabsTrigger value="settings" className="text-xs whitespace-nowrap">Settings</TabsTrigger>
              )}
            </TabsList>
          </div>

          {(isSuperAdmin || permissions.canManageUsers) && (
            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Advanced User Management
                      </CardTitle>
                      <CardDescription>
                        Comprehensive user account management with detailed profiles and controls
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
                        <Select value={userSortBy} onValueChange={(v: any) => setUserSortBy(v)}>
                          <SelectTrigger className="w-[140px] h-8 text-xs">
                            <ArrowUpDown className="h-3 w-3 mr-2" />
                            <SelectValue placeholder="Sort By" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="newest">Newest First</SelectItem>
                            <SelectItem value="oldest">Oldest First</SelectItem>
                            <SelectItem value="email">Email (A-Z)</SelectItem>
                            <SelectItem value="credits">Most Credits</SelectItem>
                            <SelectItem value="scripts">Most Scripts</SelectItem>
                          </SelectContent>
                        </Select>

                        <ToggleGroup type="single" value={userViewMode} onValueChange={(v) => v && setUserViewMode(v as any)} className="bg-background rounded-md border">
                          <ToggleGroupItem value="grid" className="h-8 w-8 p-0" aria-label="Grid view">
                            <LayoutGrid className="h-4 w-4" />
                          </ToggleGroupItem>
                          <ToggleGroupItem value="list" className="h-8 w-8 p-0" aria-label="List view">
                            <List className="h-4 w-4" />
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      <Activity className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-muted-foreground animate-pulse">Loading users...</p>
                    </div>
                  ) : userViewMode === 'grid' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                      {sortedUsers.map((user) => (
                        <DetailedUserCard
                          key={user.id}
                          user={user}
                          onUpdateUser={handleUpdateUser}
                          onDeleteUser={handleDeleteUser}
                          onSendNotification={(userId) => console.log('Send notification to', userId)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-muted/50 text-muted-foreground font-medium border-b text-xs uppercase tracking-wider">
                            <tr>
                              <th className="px-4 py-3">User</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3">Joined</th>
                              <th className="px-4 py-3 text-center">Scripts</th>
                              <th className="px-4 py-3 text-center">Credits</th>
                              <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {sortedUsers.map((user) => (
                              <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={user.profile?.avatar_url} />
                                      <AvatarFallback>{user.profile?.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col overflow-hidden">
                                      <span className="font-medium truncate">{user.profile?.full_name || 'Unknown'}</span>
                                      <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <Badge className={`text-[10px] px-1.5 py-0 h-5 border-none ${user.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                                    user.status === 'paused' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100' :
                                      'bg-red-100 text-red-700 hover:bg-red-100'
                                    }`}>
                                    {user.status}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                                  {new Date(user.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 text-center font-mono">
                                  {user.activity?.scripts_count || 0}
                                </td>
                                <td className="px-4 py-3 text-center font-mono text-primary font-semibold">
                                  {user.profile?.ai_credits || 0}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleUpdateUser(user.id, { status: user.status === 'active' ? 'paused' : 'active' })}>
                                      {user.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 text-green-600" />}
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleSendNotification({ user_id: user.id, email: user.email })}>
                                      <Mail className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDeleteUser(user.id)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {(isSuperAdmin || permissions.canManageSubscriptions) && (
            <TabsContent value="subscriptions" className="space-y-4">
              <SubscriptionPlanManager
                plans={subscriptionPlans}
                onCreatePlan={async (newPlanData) => {
                  try {
                    const id = newPlanData.name.toLowerCase().replace(/\s+/g, '-');
                    const { error } = await supabase
                      .from('subscription_plans' as any)
                      .insert({
                        id,
                        name: newPlanData.name,
                        description: newPlanData.description,
                        monthly_price: newPlanData.price,
                        yearly_price: newPlanData.yearlyPrice || newPlanData.price * 10,
                        features: newPlanData.features,
                        limits: newPlanData.limits,
                        is_active: newPlanData.isActive,
                        is_popular: (newPlanData as any).popular || false
                      });

                    if (error) throw error;

                    await fetchSubscriptionPlans();
                    toast({ title: "Success", description: "Plan created and saved to database" });
                  } catch (error: any) {
                    console.error('Error creating plan:', error);
                    toast({ title: "Error", description: error.message, variant: "destructive" });
                  }
                }}
                onUpdatePlan={async (planId, updates) => {
                  try {
                    const { error } = await supabase
                      .from('subscription_plans' as any)
                      .update({
                        name: updates.name,
                        description: updates.description,
                        monthly_price: updates.price,
                        yearly_price: (updates as any).yearlyPrice || (updates.price ? updates.price * 10 : undefined),
                        features: updates.features,
                        limits: updates.limits,
                        is_active: updates.isActive,
                        is_popular: (updates as any).popular
                      })
                      .eq('id', planId);

                    if (error) throw error;

                    await fetchSubscriptionPlans();
                    toast({ title: "Success", description: "Plan updated in database" });
                  } catch (error: any) {
                    console.error('Error updating plan:', error);
                    toast({ title: "Error", description: error.message, variant: "destructive" });
                  }
                }}
                onDeletePlan={async (planId) => {
                  try {
                    const { error } = await supabase
                      .from('subscription_plans' as any)
                      .delete()
                      .eq('id', planId);

                    if (error) throw error;

                    await fetchSubscriptionPlans();
                    toast({ title: "Deleted", description: "Plan removed from database" });
                  } catch (error: any) {
                    console.error('Error deleting plan:', error);
                    toast({ title: "Error", description: error.message, variant: "destructive" });
                  }
                }}
              />
            </TabsContent>
          )}

          {(isSuperAdmin || permissions.canSendNotifications) && (
            <TabsContent value="notifications" className="space-y-4">
              <NotificationManager
                users={users.map(u => ({ id: u.id, email: u.email, full_name: u.profile?.full_name }))}
                templates={notificationTemplates}
                history={notificationHistory}
                onSendNotification={handleSendNotification}
                onSaveTemplate={handleSaveTemplate}
              />
            </TabsContent>
          )}

          {(isSuperAdmin || permissions.canManageAdmins) && (
            <TabsContent value="admins" className="space-y-4">
              <AdminLevelManager
                roles={adminRoles}
                admins={adminUsers}
                permissions={[]}
                onCreateRole={async (role: any) => {
                  try {
                    const dbRole = {
                      name: role.name,
                      level: role.level,
                      color: role.color,
                      can_manage_users: role.canManageUsers,
                      can_manage_subscriptions: role.canManageSubscriptions,
                      can_manage_system: role.canManageSystem,
                      can_view_analytics: role.canViewAnalytics,
                      can_send_notifications: role.canSendNotifications,
                      can_manage_admins: role.canManageAdmins
                    };
                    const { data, error } = await supabase.from('admin_roles' as any).insert([dbRole]).select().single();
                    if (error) throw error;

                    const mappedRole = {
                      ...data,
                      canManageUsers: data.can_manage_users,
                      canManageSubscriptions: data.can_manage_subscriptions,
                      canManageSystem: data.can_manage_system,
                      canViewAnalytics: data.can_view_analytics,
                      canSendNotifications: data.can_send_notifications,
                      canManageAdmins: data.can_manage_admins
                    };
                    setAdminRoles(prev => [...prev, mappedRole]);
                    toast({ title: 'Role Created', description: `"${role.name}" role has been created successfully.` });
                  } catch (error: any) {
                    toast({ title: 'Error', description: error.message, variant: 'destructive' });
                  }
                }}
                onUpdateRole={async (roleId, updates: any) => {
                  try {
                    const dbUpdates: any = { ...updates };
                    if ('canManageUsers' in updates) dbUpdates.can_manage_users = updates.canManageUsers;
                    if ('canManageSubscriptions' in updates) dbUpdates.can_manage_subscriptions = updates.canManageSubscriptions;
                    if ('canManageSystem' in updates) dbUpdates.can_manage_system = updates.canManageSystem;
                    if ('canViewAnalytics' in updates) dbUpdates.can_view_analytics = updates.canViewAnalytics;
                    if ('canSendNotifications' in updates) dbUpdates.can_send_notifications = updates.canSendNotifications;
                    if ('canManageAdmins' in updates) dbUpdates.can_manage_admins = updates.canManageAdmins;

                    delete dbUpdates.canManageUsers;
                    delete dbUpdates.canManageSubscriptions;
                    delete dbUpdates.canManageSystem;
                    delete dbUpdates.canViewAnalytics;
                    delete dbUpdates.canSendNotifications;
                    delete dbUpdates.canManageAdmins;

                    const { error } = await supabase.from('admin_roles' as any).update(dbUpdates).eq('id', roleId);
                    if (error) throw error;
                    setAdminRoles(prev => prev.map(r => r.id === roleId ? { ...r, ...updates } : r));
                    toast({ title: 'Role Updated', description: 'Admin role has been updated.' });
                  } catch (error: any) {
                    toast({ title: 'Error', description: error.message, variant: 'destructive' });
                  }
                }}
                onDeleteRole={async (roleId) => {
                  try {
                    const { error } = await supabase.from('admin_roles' as any).delete().eq('id', roleId);
                    if (error) throw error;
                    setAdminRoles(prev => prev.filter(r => r.id !== roleId));
                    toast({ title: 'Role Deleted', description: 'Admin role has been removed.' });
                  } catch (error: any) {
                    toast({ title: 'Error', description: error.message, variant: 'destructive' });
                  }
                }}
                onUpdateAdminRole={async (adminId, roleId) => {
                  try {
                    const { error } = await supabase.from('admin_users').update({ role_id: roleId }).eq('id', adminId);
                    if (error) throw error;
                    setAdminUsers(prev => prev.map(a => a.id === adminId ? { ...a, role_id: roleId } : a));
                  } catch (error: any) {
                    toast({ title: 'Error', description: error.message, variant: 'destructive' });
                  }
                }}
                onToggleAdminStatus={async (adminId, isActive) => {
                  try {
                    const { data, error } = await supabase.functions.invoke('admin-operations', {
                      body: { 
                        operation: 'update_admin_status', 
                        data: { adminId, isActive } 
                      }
                    });

                    if (error) throw error;

                    setAdminUsers(prev => prev.map(admin => 
                      admin.id === adminId ? { ...admin, is_active: isActive } : admin
                    ));

                    toast({
                      title: "Success",
                      description: `Admin status ${isActive ? 'activated' : 'deactivated'} successfully`,
                    });
                  } catch (error: any) {
                    console.error('Error updating admin status:', error);
                    toast({
                      title: "Error",
                      description: error.message || "Failed to update admin status",
                      variant: "destructive"
                    });
                  }
                }}

              />
            </TabsContent>
          )}

          {(isSuperAdmin || permissions.canViewAnalytics) && (
            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    System Analytics
                  </CardTitle>
                  <CardDescription>
                    Comprehensive system usage and performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{stats.totalUsers}</div>
                      <div className="text-sm text-muted-foreground">Total Users</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{stats.activeUsers}</div>
                      <div className="text-sm text-muted-foreground">Active This Month</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">Conversion Rate</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-2xl font-bold">${stats.totalRevenue}</div>
                      <div className="text-sm text-muted-foreground">Monthly Revenue</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* POSTHOG EMBED SECTION */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Detailed Analytics (PostHog)
                  </CardTitle>
                  <CardDescription>
                    Live product analytics, feature usage, and user behavior powered by PostHog
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!systemSettings.posthog_dashboard_url ? (
                    <div className="bg-muted/30 border border-muted p-8 rounded-lg text-center space-y-4">
                      <div className="inline-flex items-center justify-center p-4 bg-muted rounded-full">
                        <BarChart3 className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium">PostHog Dashboard Not Configured</h4>
                        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                          Paste your PostHog Shared Dashboard iframe URL here to monitor your product metrics directly from this admin panel. You can generate this from your PostHog project by clicking "Share" on any dashboard.
                        </p>
                      </div>
                      <div className="flex max-w-xl mx-auto items-center gap-3 pt-4">
                        <Input 
                          id="posthog-url-input"
                          placeholder="https://us.i.posthog.com/embedded/..."
                          className="flex-1"
                        />
                        <Button 
                          onClick={() => {
                            const input = document.getElementById('posthog-url-input') as HTMLInputElement;
                            if (input?.value) {
                              const valueToSave = input.value.trim();
                              // Simple extraction if they paste the full iframe snippet
                              const match = valueToSave.match(/src="([^"]+)"/);
                              const finalUrl = match ? match[1] : valueToSave;
                              
                              if (finalUrl.includes('posthog.com')) {
                                handleUpdateSetting('posthog_dashboard_url', finalUrl);
                              } else {
                                toast({
                                  title: "Invalid URL",
                                  description: "Please enter a valid PostHog URL",
                                  variant: "destructive"
                                });
                              }
                            }
                          }}
                        >
                          Save URL
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              // By setting it to null (or empty), the UI will instantly flip back.
                              await handleUpdateSetting('posthog_dashboard_url', '');
                              toast({ title: "Configuration removed", description: "You can now map a new dashboard URL." });
                            } catch (error: any) {
                              toast({ title: "Failed to reset", description: error.message, variant: "destructive" });
                            }
                          }}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Reconfigure URL
                        </Button>
                      </div>
                      <div className="w-full bg-background rounded-lg border overflow-hidden min-h-[650px] relative">
                         <iframe 
                           src={systemSettings.posthog_dashboard_url} 
                           allowFullScreen 
                           width="100%" 
                           height="100%" 
                           frameBorder="0"
                           className="absolute inset-0 w-full h-full min-h-[650px]"
                         ></iframe>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {(isSuperAdmin || permissions.canManageAdmins) && (
            <TabsContent value="invites" className="space-y-4">
              {isSuperAdmin ? (
                <AdminInvitationManager />
              ) : (
                <Card className="border-destructive/20 bg-destructive/5">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-destructive" />
                      <CardTitle>Access Denied</CardTitle>
                    </div>
                    <CardDescription>
                      Only Super Admins can manage invitation passcodes.
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </TabsContent>
          )}

          {(isSuperAdmin || permissions.canManageSystem) && (
            <TabsContent value="ai-cache" className="space-y-4">
              <GlobalCacheMonitor />
            </TabsContent>
          )}

          {(isSuperAdmin || permissions.canManageSystem) && (
            <TabsContent value="system" className="space-y-4">
              <AIModelSelector onUpdateSetting={handleUpdateSetting} />

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    System Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure system-wide settings and maintenance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">Maintenance Mode</div>
                        <div className="text-sm text-muted-foreground">Disable all user access except admins</div>
                      </div>
                      <button
                        onClick={() => handleUpdateSetting('maintenance_mode', !systemSettings.maintenance_mode)}
                        className={`px-4 py-2 rounded-md ${systemSettings.maintenance_mode ? 'bg-red-600 text-white' : 'bg-secondary'}`}
                      >
                        {systemSettings.maintenance_mode ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {(isSuperAdmin || permissions.canManageSystem) && (
            <TabsContent value="settings" className="space-y-4">
              <SystemSettingsManager
                settings={systemSettings}
                apiKeyStatuses={apiKeyStatuses}
                onUpdateSetting={handleUpdateSetting}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AdminAccessGate>
  );
}
