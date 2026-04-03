import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return new Response(JSON.stringify({ error: 'Missing environment configuration' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized', details: authError }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestBody = await req.json();
    const { operation, data } = requestBody;
    console.log(`[AdminOperation] ${operation} requested by ${user.id} (${user.email})`);
    console.log('Request data:', JSON.stringify(data));

    switch (operation) {
      case 'health_check':
        return new Response(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'check_admin_exists':
        try {
          // Check if any admin exists (using service role to bypass RLS)
          const { data: adminData, error: adminError } = await supabaseClient
            .from('admin_users')
            .select('id')
            .eq('is_active', true)
            .limit(1)

          if (adminError) {
            console.error('Error checking admin existence:', adminError)
            throw adminError
          }

          return new Response(JSON.stringify({
            adminExists: adminData && adminData.length > 0
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        } catch (error) {
          console.error('Error checking admin existence:', error)
          return new Response(JSON.stringify({ error: 'Failed to check admin existence' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

      case 'list_users':
        try {
          // First check if user is admin (simplified check)
          const { data: adminData, error: adminError } = await supabaseClient
            .from('admin_users')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle()

          if (adminError) {
            console.error('Admin check error:', adminError)
            return new Response(JSON.stringify({ error: 'Admin verification failed' }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }

          if (!adminData) {
            console.error('User is not admin:', user.id)
            return new Response(JSON.stringify({ error: 'Admin access required' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }

          // Fetch users using service role
          const { data: authUsers, error: usersError } = await supabaseClient.auth.admin.listUsers()
          if (usersError) {
            console.error('List users error:', usersError)
            throw usersError
          }

          const rawUsers = authUsers?.users || []
          const userIds = rawUsers.map(u => u.id)
          console.log(`Processing ${rawUsers.length} users with IDs:`, userIds)

          // Fetch profiles, scripts, and logs in parallel with error handling
          const [profilesResult, scriptsResult, logsResult] = await Promise.all([
            supabaseClient.from('profiles').select('*').in('id', userIds),
            supabaseClient.from('scripts').select('user_id').in('user_id', userIds),
            supabaseClient.from('ai_usage_logs').select('user_id').in('user_id', userIds)
          ])

          if (profilesResult.error) console.error('Profiles query error:', profilesResult.error)
          if (scriptsResult.error) console.error('Scripts query error:', scriptsResult.error)
          if (logsResult.error) console.error('Logs query error:', logsResult.error)

          const profiles = profilesResult.data || []
          const scripts = scriptsResult.data || []
          const aiLogs = logsResult.data || []

          console.log(`Found: ${profiles.length} profiles, ${scripts.length} scripts, ${aiLogs.length} logs`)

          // Map counts with explicit string keys to avoid type issues
          const scriptCounts: Record<string, number> = {}
          scripts.forEach((s: any) => {
            if (s.user_id) scriptCounts[s.user_id] = (scriptCounts[s.user_id] || 0) + 1
          })

          const aiUsageCounts: Record<string, number> = {}
          aiLogs.forEach((l: any) => {
            if (l.user_id) aiUsageCounts[l.user_id] = (aiUsageCounts[l.user_id] || 0) + 1
          })

          const profileMap: Record<string, any> = {}
          profiles.forEach((p: any) => {
            if (p.id) profileMap[p.id] = p
          })

          // Merge data
          const enrichedUsers = rawUsers.map(authUser => {
            const userId = authUser.id
            const profile = profileMap[userId] || null

            return {
              ...authUser,
              profile: profile,
              stats: {
                scripts_count: scriptCounts[userId] || 0,
                total_ai_usage: aiUsageCounts[userId] || 0
              }
            }
          })

          return new Response(JSON.stringify({
            users: enrichedUsers,
            _debug: {
              profileCount: profiles.length,
              scriptCount: scripts.length,
              logCount: aiLogs.length,
              userIds: userIds
            }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        } catch (error: any) {
          console.error('Error listing users:', error)
          return new Response(JSON.stringify({ error: 'Failed to list users', details: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

      case 'update_user_credits':
        try {
          // First check if user is admin
          const { data: adminCheck, error: adminCheckError } = await supabaseClient
            .from('admin_users')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle()

          if (adminCheckError || !adminCheck) {
            return new Response(JSON.stringify({ error: 'Admin access required' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }

          const { userId, credits } = data
          const { error: updateError } = await supabaseClient
            .from('profiles')
            .update({ ai_credits: credits })
            .eq('id', userId)

          if (updateError) throw updateError

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        } catch (error) {
          console.error('Error updating user credits:', error)
          return new Response(JSON.stringify({ error: 'Failed to update user credits' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

      case 'bulk_grant_credits':
        try {
          // First check if user is admin
          const { data: adminCheck, error: adminCheckError } = await supabaseClient
            .from('admin_users')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle()

          if (adminCheckError || !adminCheck) {
            return new Response(JSON.stringify({ error: 'Admin access required' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }

          const { credits } = data
          const { error: updateError } = await supabaseClient
            .rpc('bulk_update_credits', { credit_amount: credits })

          if (updateError) throw updateError

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        } catch (error) {
          console.error('Error bulk granting credits:', error)
          return new Response(JSON.stringify({ error: 'Failed to bulk grant credits' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

      case 'create_subscription':
        try {
          // First check if user is admin
          const { data: adminCheck, error: adminCheckError } = await supabaseClient
            .from('admin_users')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle()

          if (adminCheckError || !adminCheck) {
            return new Response(JSON.stringify({ error: 'Admin access required' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }

          const { email, tier } = data
          const { error: subError } = await supabaseClient
            .from('subscribers')
            .insert({
              email,
              subscription_tier: tier,
              subscribed: true,
              subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            })

          if (subError) throw subError

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        } catch (error) {
          console.error('Error creating subscription:', error)
          return new Response(JSON.stringify({ error: 'Failed to create subscription' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

      case 'get_system_stats':
        try {
          // First check if user is admin
          const { data: adminCheck, error: adminCheckError } = await supabaseClient
            .from('admin_users')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle()

          if (adminCheckError || !adminCheck) {
            return new Response(JSON.stringify({ error: 'Admin access required' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }

          // Get various system statistics
          const [usersCount, scriptsCount, subscriptionsCount, totalCredits] = await Promise.all([
            supabaseClient.auth.admin.listUsers().then(({ data }) => data?.users?.length || 0),
            supabaseClient.from('scripts').select('id', { count: 'exact' }).then(({ count }) => count || 0),
            supabaseClient.from('subscribers').select('id', { count: 'exact' }).then(({ count }) => count || 0),
            supabaseClient.from('profiles').select('ai_credits').then(({ data }) =>
              data?.reduce((sum, profile) => sum + (profile.ai_credits || 0), 0) || 0
            )
          ])

          return new Response(JSON.stringify({
            totalUsers: usersCount,
            totalScripts: scriptsCount,
            totalSubscriptions: subscriptionsCount,
            totalCredits: totalCredits
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        } catch (error) {
          console.error('Error getting system stats:', error)
          return new Response(JSON.stringify({ error: 'Failed to get system stats' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

      case 'get_admin_roles':
        try {
          const { data: roles, error: rolesError } = await supabaseClient
            .from('admin_roles')
            .select('*')
            .order('level', { ascending: false })

          if (rolesError) throw rolesError

          return new Response(JSON.stringify({ roles }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        } catch (error) {
          console.error('Error getting admin roles:', error)
          return new Response(JSON.stringify({ error: 'Failed to get admin roles' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

      case 'update_system_setting':
        try {
          // 1. Basic Admin Check
          const { data: adminCheck, error: adminCheckError } = await supabaseClient
            .from('admin_users')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle()

          if (adminCheckError || !adminCheck) {
            return new Response(JSON.stringify({ error: 'Admin access required' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }

          // 2. Sensitive Keys Super Admin Check
          const sensitiveKeys = [
            'openai_api_key',
            'anthropic_api_key',
            'xai_api_key',
            'deepseek_api_key',
            'active_ai_provider',
            'active_ai_model'
          ];
          const { key, value, description } = data;

          if (sensitiveKeys.includes(key)) {
            const { data: isSuper, error: superCheckError } = await (supabaseClient.rpc as any)('is_super_admin', {
              user_id: user.id
            });

            if (superCheckError || !isSuper) {
              return new Response(JSON.stringify({ error: 'Super Admin access required for sensitive keys' }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              })
            }
          }

          // 3. Perform the update (Edge Function bypasses RLS so it can write the API keys)
          const { error: settingError } = await supabaseClient
            .from('system_settings')
            .upsert({
              key,
              value: typeof value === 'string' ? value : JSON.stringify(value),
              description: description || null
            })

          if (settingError) throw settingError

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        } catch (error: any) {
          console.error('Error updating system setting:', error)
          return new Response(JSON.stringify({ error: 'Failed to update system setting', message: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

      case 'get_api_key_status':
        try {
          // 1. Basic Admin Check
          const { data: adminCheck, error: adminCheckError } = await supabaseClient
            .from('admin_users')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle()

          if (adminCheckError || !adminCheck) {
            return new Response(JSON.stringify({ error: 'Admin access required' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }

          // 2. Fetch the keys using the service role (which bypasses the restricted RLS)
          const apiKeysToFetch = [
            'openai_api_key',
            'anthropic_api_key',
            'xai_api_key',
            'deepseek_api_key'
          ];

          const { data: settingsData, error: fetchError } = await supabaseClient
            .from('system_settings')
            .select('key, value')
            .in('key', apiKeysToFetch);

          if (fetchError) throw fetchError;

          // 3. Transform into a map of booleans (has value or not) - NEVER RETURN THE ACTUAL KEY
          const stausMap: Record<string, boolean> = {};

          // Initialize all to false
          apiKeysToFetch.forEach(k => { stausMap[k] = false; });

          // Update true if value exists and length > 5
          settingsData?.forEach(setting => {
            // Check if the value is a string with length > 5 (JSON empty strings are '""' which is length 2)
            stausMap[setting.key] = typeof setting.value === 'string' && setting.value.length > 5;
          });

          return new Response(JSON.stringify({ success: true, statuses: stausMap }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        } catch (error: any) {
          console.error('Error fetching API key status:', error)
          return new Response(JSON.stringify({ error: 'Failed to check API keys', message: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

      case 'emergency_cleanup':
        try {
          // ONLY authorized super admins can run this
          const authorizedEmails = ['uploadakan@gmail.com', 'pelicanink2025@gmail.com'];
          if (!authorizedEmails.includes(user.email || '')) {
            return new Response(JSON.stringify({ error: 'Access denied. Emergency cleanup restricted.' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }

          console.log('EMERGENCY CLEANUP: Removing unauthorized admins...');

          // Delete anyone who isn't a hardcoded super admin
          const { error: deleteError, count } = await supabaseClient
            .from('admin_users')
            .delete({ count: 'exact' })
            .not('email', 'in', `(${authorizedEmails.join(',')})`);

          if (deleteError) throw deleteError;

          return new Response(JSON.stringify({ success: true, removedCount: count }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        } catch (error: any) {
          console.error('Error during emergency cleanup:', error)
          return new Response(JSON.stringify({ error: 'Cleanup failed', message: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

      case 'get_analytics':
        try {
          // First check if user is admin
          const { data: adminCheck, error: adminCheckError } = await supabaseClient
            .from('admin_users')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle()

          if (adminCheckError || !adminCheck) {
            return new Response(JSON.stringify({ error: 'Admin access required' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }

          // Get analytics data
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

          const [recentUsers, aiUsage, scriptActivity] = await Promise.all([
            supabaseClient.auth.admin.listUsers().then(({ data }) => {
              const users = data?.users || []
              return users.filter(u => u.last_sign_in_at && new Date(u.last_sign_in_at) > new Date(thirtyDaysAgo)).length
            }),
            supabaseClient.from('ai_usage_logs').select('*').gte('used_at', thirtyDaysAgo),
            supabaseClient.from('scripts').select('id').gte('created_at', thirtyDaysAgo)
          ])

          return new Response(JSON.stringify({
            monthlyActiveUsers: recentUsers,
            aiUsageCount: aiUsage.data?.length || 0,
            newScripts: scriptActivity.data?.length || 0
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        } catch (error) {
          console.error('Error getting analytics:', error)
          return new Response(JSON.stringify({ error: 'Failed to get analytics' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

      case 'create_user':
        try {
          const { data: adminCheck, error: adminCheckError } = await supabaseClient
            .from('admin_users')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle()

          if (adminCheckError || !adminCheck) {
            return new Response(JSON.stringify({ error: 'Admin access required' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }

          const { email, password, full_name, username } = data
          const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
            email,
            password,
            user_metadata: {
              full_name,
              username
            },
            email_confirm: true
          })

          if (createError) throw createError

          return new Response(JSON.stringify({ success: true, user: newUser }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        } catch (error) {
          console.error('Error creating user:', error)
          return new Response(JSON.stringify({ error: 'Failed to create user' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

      case 'delete_user':
        try {
          const { data: adminCheck, error: adminCheckError } = await supabaseClient
            .from('admin_users')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle()

          if (adminCheckError || !adminCheck) {
            return new Response(JSON.stringify({ error: 'Admin access required' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }

          const { userId } = data
          const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(userId)

          if (deleteError) throw deleteError

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        } catch (error) {
          console.error('Error deleting user:', error)
          return new Response(JSON.stringify({ error: 'Failed to delete user' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

      case 'toggle_user_status':
        try {
          const { data: adminCheck, error: adminCheckError } = await supabaseClient
            .from('admin_users')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle()

          if (adminCheckError || !adminCheck) {
            return new Response(JSON.stringify({ error: 'Admin access required' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }

          const { userId, banned } = data
          const { error: updateError } = await supabaseClient.auth.admin.updateUserById(userId, {
            ban_duration: banned ? '876000h' : 'none' // 100 years or none
          })

          if (updateError) throw updateError

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        } catch (error) {
          console.error('Error toggling user status:', error)
          return new Response(JSON.stringify({ error: 'Failed to toggle user status' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

      case 'send_notification':
        try {
          const { data: adminCheck, error: adminCheckError } = await supabaseClient
            .from('admin_users')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle()

          if (adminCheckError || !adminCheck) {
            return new Response(JSON.stringify({ error: 'Admin access required' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }

          const { type, recipients, subject, message, notificationType, actionUrl } = data
          console.log(`[send_notification] Type: ${type}, Recipients: ${recipients.length}, Subject: "${subject}", Type: ${notificationType}`)

          // 1. In-App Notifications
          if (notificationType === 'in-app' || notificationType === 'both') {
            const notificationEntries = recipients.map((recipientId: string) => ({
              user_id: recipientId,
              title: subject,
              message: message,
              type: 'system',
              action_url: actionUrl || null,
              read: false
            }))

            console.log(`[send_notification] Inserting ${notificationEntries.length} entries into notifications table...`)
            const { data: insertData, error: insertError, count } = await supabaseClient
              .from('notifications')
              .insert(notificationEntries)
              .select()

            if (insertError) {
              console.error('[send_notification] Insert Error:', JSON.stringify(insertError))
              throw insertError
            }
            console.log(`[send_notification] Successfully inserted ${count || notificationEntries.length} notifications. Result:`, JSON.stringify(insertData))
          }

          // 2. Email Notifications (Placeholder for actual email service integration)
          if (notificationType === 'email' || notificationType === 'both') {
            console.log('Email delivery requested for', recipients.length, 'recipients. SMTP/Resend integration would happen here.')
            // Note: In a production environment, you would use a service like Resend or SendGrid here.
          }

          return new Response(JSON.stringify({ success: true, count: recipients.length }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        } catch (error: any) {
          console.error('Error sending notification:', error)
          return new Response(JSON.stringify({ error: 'Failed to send notification', message: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

      case 'create_subscription_plan':
        try {
          const { data: adminCheck, error: adminCheckError } = await supabaseClient
            .from('admin_users')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle()

          if (adminCheckError || !adminCheck) {
            return new Response(JSON.stringify({ error: 'Admin access required' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }

          const { name, description, price, interval, features, limits, isActive } = data

          // Here you would create the plan in your subscription system (Stripe, etc.)
          console.log('Creating subscription plan:', name, price, interval)

          return new Response(JSON.stringify({ success: true, planId: 'new-plan-id' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        } catch (error) {
          console.error('Error creating subscription plan:', error)
          return new Response(JSON.stringify({ error: 'Failed to create subscription plan' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

      case 'update_admin_status':
        try {
          // Check if sender is super admin
          const { data: isSuper, error: superCheckError } = await (supabaseClient.rpc as any)('is_super_admin', {
            user_id: user.id
          });

          if (superCheckError || !isSuper) {
            return new Response(JSON.stringify({ error: 'Super Admin access required for this operation' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }

          const { adminId, isActive } = data;
          const { error: updateError } = await supabaseClient
            .from('admin_users')
            .update({ is_active: isActive })
            .eq('id', adminId);

          if (updateError) throw updateError;

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        } catch (error: any) {
          console.error('Error updating admin status:', error)
          return new Response(JSON.stringify({ error: 'Failed to update admin status', message: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

      case 'list_notifications':
        try {
          const { data: adminCheck, error: adminCheckError } = await supabaseClient
            .from('admin_users')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle()

          if (adminCheckError || !adminCheck) {
            return new Response(JSON.stringify({ error: 'Admin access required' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }

          const { data: notifications, error: fetchError } = await supabaseClient
            .from('notifications')
            .select('*')
            .eq('type', 'system')
            .order('created_at', { ascending: false })
            .limit(100)

          if (fetchError) throw fetchError

          return new Response(JSON.stringify({ notifications }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        } catch (error: any) {
          console.error('Error listing notifications:', error)
          return new Response(JSON.stringify({ error: 'Failed to list notifications', message: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

      case 'create_admin_role':
        try {
          const { data: adminCheck, error: adminCheckError } = await supabaseClient
            .from('admin_users')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle()

          if (adminCheckError || !adminCheck) {
            return new Response(JSON.stringify({ error: 'Admin access required' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }

          const roleData = data

          // Store admin role in database
          const { error: roleError } = await supabaseClient
            .from('admin_roles')
            .insert({
              name: roleData.name,
              level: roleData.level,
              permissions: roleData.permissions,
              color: roleData.color,
              can_manage_users: roleData.canManageUsers,
              can_manage_subscriptions: roleData.canManageSubscriptions,
              can_manage_system: roleData.canManageSystem,
              can_view_analytics: roleData.canViewAnalytics,
              can_send_notifications: roleData.canSendNotifications,
              can_manage_admins: roleData.canManageAdmins,
              created_by: user.id
            })

          if (roleError) throw roleError

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        } catch (error) {
          console.error('Error creating admin role:', error)
          return new Response(JSON.stringify({ error: 'Failed to create admin role' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

      default:
        return new Response(JSON.stringify({ error: 'Invalid operation' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
  } catch (err: any) {
    console.error('Admin operations error:', err);
    return new Response(JSON.stringify({
      error: err.message || 'An unexpected error occurred in the Edge Function',
      details: err.stack || err
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
})
