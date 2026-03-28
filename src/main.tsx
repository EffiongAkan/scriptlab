
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "@/integrations/supabase/auth";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SyncStatusProvider } from "@/contexts/SyncStatusContext";

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
            <App />
          </TooltipProvider>
        </SyncStatusProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
