
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { Layout } from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import ScriptEditor from "@/pages/ScriptEditor";
import PlotGenerator from "@/pages/PlotGenerator";

import MonetizationPage from "@/pages/MonetizationPage";
import BusinessToolsPage from "@/pages/BusinessToolsPage";
import AdminDashboard from "@/pages/AdminDashboard";
import Auth from "@/pages/Auth";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Settings from "@/pages/Settings";

import Premium from "@/pages/Premium";
import IndustryIntegrationPage from "@/pages/IndustryIntegrationPage";
import VersionControlPage from "@/pages/VersionControlPage";
import SharedScriptReader from "@/pages/SharedScriptReader";
import DebugAI from "@/pages/DebugAI";

import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/dashboard"
            element={
              <AuthGuard>
                <Layout>
                  <Dashboard />
                </Layout>
              </AuthGuard>
            }
          />
          <Route
            path="/editor/:scriptId"
            element={
              <AuthGuard>
                <Layout>
                  <ScriptEditor />
                </Layout>
              </AuthGuard>
            }
          />
          <Route
            path="/plot-generator"
            element={
              <AuthGuard>
                <Layout>
                  <PlotGenerator />
                </Layout>
              </AuthGuard>
            }
          />
          <Route
            path="/plot"
            element={<Navigate to="/plot-generator" replace />}
          />


          <Route
            path="/monetization"
            element={
              <AuthGuard>
                <Layout>
                  <MonetizationPage />
                </Layout>
              </AuthGuard>
            }
          />
          <Route
            path="/business"
            element={
              <AuthGuard>
                <Layout>
                  <BusinessToolsPage />
                </Layout>
              </AuthGuard>
            }
          />
          <Route
            path="/business-tools"
            element={
              <AuthGuard>
                <Layout>
                  <BusinessToolsPage />
                </Layout>
              </AuthGuard>
            }
          />
          <Route
            path="/settings"
            element={
              <AuthGuard>
                <Layout>
                  <Settings />
                </Layout>
              </AuthGuard>
            }
          />

          <Route
            path="/premium"
            element={
              <AuthGuard>
                <Layout>
                  <Premium />
                </Layout>
              </AuthGuard>
            }
          />
          <Route
            path="/industry-integration"
            element={
              <AuthGuard>
                <Layout>
                  <IndustryIntegrationPage />
                </Layout>
              </AuthGuard>
            }
          />
          <Route
            path="/version-control"
            element={
              <AuthGuard>
                <Layout>
                  <VersionControlPage />
                </Layout>
              </AuthGuard>
            }
          />
          <Route
            path="/admin"
            element={
              <AuthGuard>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </AuthGuard>
            }
          />
          <Route path="/share/:shareToken" element={<SharedScriptReader />} />
          <Route path="/debug-ai" element={<DebugAI />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
