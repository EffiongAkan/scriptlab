
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Home, FileText, Users, BookOpen, BarChart, Settings, Crown, GitBranch, Save, Layout, Menu, DollarSign, Shield, Zap, LogOut, User } from "lucide-react";
import { useScriptSave } from "@/hooks/useScriptSave";
import { useScriptContent } from "@/hooks/useScriptContent";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/integrations/supabase/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAICredits } from "@/hooks/useAICredits";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/NotificationBell";

const menuItems = [
  { title: "Home", path: "/", icon: Home },
  { title: "Dashboard", path: "/dashboard", icon: Layout },
  { title: "Plot Generation", path: "/plot-generator", icon: BookOpen },
  { title: "Premium", path: "/premium", icon: Crown },
  { title: "Version Control", path: "/version-control", icon: GitBranch },
  { title: "Settings", path: "/settings", icon: Settings },
];

export const AppTopbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Get script ID only when in /editor/:id, for saving
  const scriptIdMatch = location.pathname.match(/^\/editor\/([^\/]+)/);
  const scriptId = scriptIdMatch && scriptIdMatch[1] !== 'new' ? scriptIdMatch[1] : null;

  const { saveScript, isSaving } = useScriptSave(scriptId || "");
  const { elements, scriptData } = useScriptContent(scriptId || "");
  const { user } = useAuth();
  const { data: credits } = useAICredits();

  const { data: isAdmin = false } = useQuery({
    queryKey: ['user-admin-status', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.rpc('is_admin', { user_id: user.id });
      if (error) return false;
      return data || false;
    },
    enabled: !!user,
  });

  // Fetch user profile for avatar
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile-avatar', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url, full_name')
        .eq('id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const userInitials = userProfile?.full_name
    ? userProfile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'U';

  const finalMenuItems = [...menuItems];
  if (isAdmin) {
    finalMenuItems.push({ title: "Admin", path: "/admin", icon: Shield });
  }

  const isLowCredits = (credits ?? 0) < 5;

  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleSaveProject = async () => {
    try {
      setSaveStatus('saving');
      if (scriptId && saveScript && elements) {
        toast({
          title: "Saving script...",
          description: "Your script is being saved"
        });
        const success = await saveScript(elements, scriptData?.title || '');
        if (success) {
          setSaveStatus('success');
          toast({
            title: "Script saved",
            description: "Your script has been saved successfully"
          });
        } else {
          setSaveStatus('error');
          toast({
            title: "Error",
            description: "Unable to save script",
            variant: "destructive"
          });
        }
      } else {
        setSaveStatus('success');
        toast({
          title: "Project saved",
          description: "All your changes have been saved successfully"
        });
      }
    } catch (error: any) {
      setSaveStatus('error');
      console.error("Error saving project:", error && error.message ? error.message : error);
      toast({
        title: "Save failed",
        description: "There was a problem saving your project",
        variant: "destructive"
      });
    } finally {
      setTimeout(() => setSaveStatus('idle'), 1800);
    }
  };

  return (
    <nav
      className="w-full bg-sidebar text-sidebar-foreground flex items-center justify-between px-2 md:px-6 py-2 min-h-[56px] z-40 shadow-md"
      style={{ position: "sticky", top: 0 }}
      role="navigation"
      aria-label="Main site navigation"
    >
      {/* Logo and app name */}
      <div className="flex items-center gap-3 flex-shrink-0 group cursor-pointer" onClick={() => navigate("/")}>
        <img src="/brand/logo.png" alt="Scriptyn Logo" className="h-10 w-auto min-w-[40px] block drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] transition-transform group-hover:scale-110" />
        <span className="text-white font-extrabold text-xl md:text-2xl tracking-tighter transition-colors group-hover:text-naija-gold">Scriptyn</span>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex flex-1 items-center justify-center gap-1 ml-3">
        {
          finalMenuItems.map(item => {
            const isActive = location.pathname === item.path;
            const isPremium = item.title === 'Premium';
            return (
              <Button
                asChild
                key={item.path}
                variant={isActive ? "secondary" : "ghost"}
                size="default"
                className={`flex items-center px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-naija-gold ${
                  isPremium
                    ? isActive
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                      : 'text-purple-300 hover:text-purple-200 hover:bg-purple-600/10'
                    : isActive
                      ? 'bg-sidebar-accent text-white'
                      : 'text-sidebar-foreground'
                }`}
              >
                <Link
                  to={item.path}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={item.title}
                  className="flex items-center gap-2"
                >
                  <item.icon className={`h-4 w-4 ${isPremium ? 'text-purple-400' : ''}`} />
                  <span className="text-sm">{item.title}</span>
                </Link>
              </Button>
            );
          })
        }
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-sidebar-foreground p-2"
              aria-label="Open navigation menu"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] bg-sidebar text-sidebar-foreground border-sidebar-border">
            <div className="flex flex-col gap-4 mt-6">
              <div className="flex items-center gap-2 pb-4 border-b border-sidebar-border flex-shrink-0">
                <img src="/brand/logo.png" alt="Scriptyn Logo" className="h-6 w-auto min-w-[24px] block" />
                <span className="text-white font-bold text-lg">Scriptyn</span>
              </div>

              <div className="flex flex-col gap-2">
                {finalMenuItems.map(item => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Button
                      asChild
                      key={item.path}
                      variant={isActive ? "secondary" : "ghost"}
                      className={`justify-start h-12 px-4 ${isActive ? "bg-sidebar-accent text-white" : "text-sidebar-foreground"} transition-colors`}
                    >
                      <Link
                        to={item.path}
                        aria-current={isActive ? "page" : undefined}
                        className="flex items-center gap-3"
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="text-base">{item.title}</span>
                      </Link>
                    </Button>
                  );
                })}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Credits Badge */}
        <Link to="/premium?tab=credits" className="flex">
          <Button
            variant="outline"
            size={isMobile ? "sm" : "default"}
            className={cn(
              "px-3 border-sidebar-border bg-sidebar-accent/50 hover:bg-sidebar-accent gap-2",
              isLowCredits ? "text-red-400 border-red-500/30" : "text-naija-gold"
            )}
            title="AI Credits"
          >
            <Zap className="h-4 w-4" />
            <span className="font-semibold">{credits ?? 0}</span>
          </Button>
        </Link>

        {/* Notifications */}
        <NotificationBell />

        {/* Logout Button (desktop: replaced by avatar; mobile: show icon) */}
        <Button
          variant="ghost"
          size={isMobile ? "sm" : "default"}
          onClick={handleSignOut}
          className="md:hidden text-sidebar-foreground px-2"
          aria-label="Sign Out"
        >
          <LogOut className="h-5 w-5" />
        </Button>

        {/* User Avatar (desktop) */}
        <button
          onClick={handleSignOut}
          className="hidden md:flex h-9 w-9 rounded-full overflow-hidden border-2 border-white/20 hover:border-naija-gold/60 transition-all items-center justify-center bg-gray-700 flex-shrink-0"
          title={`Signed in as ${user?.email ?? 'User'} — click to sign out`}
          aria-label="User profile / Sign out"
        >
          {userProfile?.avatar_url ? (
            <img
              src={userProfile.avatar_url}
              alt="Profile"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xs font-bold text-white">{userInitials}</span>
          )}
        </button>
      </div>
    </nav>
  );
};

export default AppTopbar;
