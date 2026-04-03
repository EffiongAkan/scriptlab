import { useEffect } from 'react';
import { useAuth } from '@/integrations/supabase/auth';
import posthog from 'posthog-js';

export function usePostHogIdentity() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Identify the user in PostHog once logged in
      posthog.identify(user.id, {
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.first_name || 'Anonymous User',
        created_at: user.created_at,
      });
    } else {
      // Reset the user's identity when they log out
      posthog.reset();
    }
  }, [user]);
}
