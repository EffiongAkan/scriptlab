
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "@/integrations/supabase/auth";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SyncStatusProvider } from "@/contexts/SyncStatusContext";
import { PostHogProvider } from "@/contexts/PostHogProvider";
import * as Sentry from "@sentry/react";

// Initialize Sentry for Error Monitoring
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Tracing
    tracesSampleRate: 1.0, // Capture 100% of the transactions
    // Session Replay
    replaysSessionSampleRate: 0.1, // Sample 10% of sessions
    replaysOnErrorSampleRate: 1.0, // Capture 100% of sessions with errors
    environment: import.meta.env.MODE,
  });
}

// Register Service Worker for PWA / Offline Support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="script-app-theme">
      <AuthProvider>
        <SyncStatusProvider>
          <TooltipProvider>
            <PostHogProvider>
              <Sentry.ErrorBoundary fallback={<p>An error has occurred.</p>}>
                <App />
              </Sentry.ErrorBoundary>
            </PostHogProvider>
          </TooltipProvider>
        </SyncStatusProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
