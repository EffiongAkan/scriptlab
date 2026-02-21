
import { useState } from "react";
import {
  Home,
  DollarSign,
  Briefcase,
  Settings,
  Wand2,
  Shield,
  Crown,
  Zap,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/integrations/supabase/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAICredits } from "@/hooks/useAICredits";
import { useSubscription } from "@/hooks/useSubscription";

export function AppSidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: credits } = useAICredits();
  const { subscription } = useSubscription();

  // Check if user is admin
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

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "AI Plot Generator", href: "/plot-generator", icon: Wand2 },
    { name: "Monetization", href: "/monetization", icon: DollarSign },
    { name: "Business Tools", href: "/business", icon: Briefcase },
    { name: "Premium", href: "/premium", icon: Crown },
  ];

  if (isAdmin) {
    navigation.push({ name: "Admin", href: "/admin", icon: Shield });
  }

  const isLowCredits = (credits ?? 0) < 5;

  return (
    <div className={cn("flex flex-col h-full border-r bg-card", isCollapsed ? "w-16" : "w-64")}>
      <div className="p-4 flex items-center gap-3">
        <div className="bg-white p-1 rounded-md flex items-center justify-center flex-shrink-0">
          <img src="/brand/logo.png" alt="ScriptLab Logo" className="h-6 w-auto min-w-[24px]" />
        </div>
        {!isCollapsed && <span className="font-bold text-lg text-primary">ScriptLab</span>}
      </div>

      <div className="px-4 pb-2">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn("w-full justify-start", isCollapsed && "justify-center px-2")}
            >
              <Settings className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2">Collapse Sidebar</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>{isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Tooltip key={item.name} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Link to={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        isActive && "bg-secondary text-secondary-foreground",
                        isCollapsed && "justify-center px-2"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span className="ml-2">{item.name}</span>}
                    </Button>
                  </Link>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">
                    <p>{item.name}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Credits Footer */}
      <Separator />
      <div className="p-3">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Link to="/premium?tab=credits">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors",
                  isLowCredits
                    ? "bg-red-500/10 hover:bg-red-500/20 border border-red-500/30"
                    : "bg-primary/10 hover:bg-primary/20"
                )}
              >
                <Zap
                  className={cn("h-4 w-4 flex-shrink-0", isLowCredits ? "text-red-400" : "text-primary")}
                />
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold">
                      {isLowCredits ? "⚠ Low Credits" : "AI Credits"}
                    </div>
                    <div className={cn("text-xs", isLowCredits ? "text-red-400" : "text-muted-foreground")}>
                      {credits ?? 0} remaining
                    </div>
                  </div>
                )}
                {!isCollapsed && (
                  <Badge
                    variant={isLowCredits ? "destructive" : "secondary"}
                    className="text-xs px-1.5"
                  >
                    {credits ?? 0}
                  </Badge>
                )}
              </div>
            </Link>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right">
              <p>{credits ?? 0} AI Credits remaining</p>
            </TooltipContent>
          )}
        </Tooltip>
      </div>
    </div>
  );
}
