import React, { useEffect } from 'react';
import posthog from 'posthog-js';

// Read from env vars
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST;

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only initialize if keys are present
    if (POSTHOG_KEY && POSTHOG_HOST) {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        // Enable session recording
        disable_session_recording: false,
        // Enable automatic pageview capture for SPA
        capture_pageview: true,
        // Automatically capture page leaves to measure duration
        capture_pageleave: true,
        // Enable autocapture
        autocapture: true,
        loaded: (posthog) => {
          if (import.meta.env.DEV) {
            // Optional: turn on debug mode in development
            // posthog.debug()
          }
        }
      });
    } else {
      console.warn("PostHog initialization skipped: Missing VITE_POSTHOG_KEY or VITE_POSTHOG_HOST in environment variables.");
    }
  }, []);

  // Make sure posthog is accessible to other components using the standard posthog-js library import
  // No Context is strictly needed if we just import `posthog` from 'posthog-js' in components to use it
  return <>{children}</>;
}
