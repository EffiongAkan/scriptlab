
import React from "react";
import { AppTopbar } from "./AppTopbar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { AuthGuard } from "./AuthGuard";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppSidebar } from "./AppSidebar";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isEditor = location.pathname.startsWith('/editor');

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <AuthGuard>
      <div className="flex min-h-screen w-full bg-background">
        {/* Desktop Sidebar - Hidden on mobile */}
        {/* Sidebar has been consolidated into Topbar per user request */}

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 h-screen overflow-hidden">
          {/* Fixed Top Navigation Bar - Hidden on mobile editor to save space */}
          {(!isMobile || !isEditor) && (
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
              <div className="flex h-14 items-center gap-2 px-3 md:px-6">
                {/* Mobile menu has been consolidated to the right side inside AppTopbar */}

                {/* App Topbar */}
                <div className="flex-1 overflow-hidden">
                  <AppTopbar />
                </div>

                {/* Sign Out Button */}
                <Button
                  variant="ghost"
                  size={isMobile ? "sm" : "default"}
                  onClick={handleSignOut}
                  className="shrink-0"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </div>
            </header>
          )}

          {/* Main Content */}
          <main className={cn(
            "flex-1",
            isEditor ? "overflow-hidden p-0 flex flex-col" : "overflow-y-auto p-3 md:p-6 lg:p-8"
          )}>
            <div className={cn(
              "mx-auto w-full",
              isEditor ? "max-w-none h-full flex flex-col" : "max-w-7xl"
            )}>{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

export default Layout;
