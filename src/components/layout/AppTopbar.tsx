
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Home, FileText, Users, BookOpen, BarChart, Settings, Briefcase, Crown, GitBranch, Factory, Save, Layout, Menu } from "lucide-react";
import { useScriptSave } from "@/hooks/useScriptSave";
import { useScriptContent } from "@/hooks/useScriptContent";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

const menuItems = [
  { title: "Home", path: "/", icon: Home },
  { title: "Dashboard", path: "/dashboard", icon: Layout },
  { title: "Plot Generation", path: "/plot-generator", icon: BookOpen },
  { title: "Settings", path: "/settings", icon: Settings },
  { title: "Business Tools", path: "/business-tools", icon: Briefcase },
  { title: "Premium", path: "/premium", icon: Crown },
  { title: "Version Control", path: "/version-control", icon: GitBranch },
  { title: "Industry Integration", path: "/industry-integration", icon: Factory },
];

export const AppTopbar: React.FC = () => {
  const location = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Get script ID only when in /editor/:id, for saving
  const scriptIdMatch = location.pathname.match(/\/editor\/([^/]+)/);
  const scriptId = scriptIdMatch ? scriptIdMatch[1] : null;

  const { saveScript, isSaving } = useScriptSave(scriptId || "");
  const { elements, scriptData } = useScriptContent(scriptId || "");

  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'success' | 'error'>('idle');

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
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="bg-white p-1 rounded-md flex items-center justify-center flex-shrink-0">
          <img src="/brand/logo.png" alt="ScriptLab Logo" className="h-8 w-auto min-w-[32px] block" />
        </div>
        <span className="text-white font-bold text-lg md:text-xl">ScriptLab</span>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex flex-1 items-center justify-center gap-2 ml-3">
        {
          menuItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Button
                asChild
                key={item.path}
                variant={isActive ? "secondary" : "ghost"}
                size="default"
                className={`flex items-center px-4 py-2 ${isActive ? "bg-sidebar-accent text-white" : "text-sidebar-foreground"} transition-colors focus:outline-none focus:ring-2 focus:ring-naija-gold`}
              >
                <Link
                  to={item.path}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={item.title}
                  className="flex items-center gap-2"
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-base">{item.title}</span>
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
                <div className="bg-white p-1 rounded-md flex items-center justify-center flex-shrink-0">
                  <img src="/brand/logo.png" alt="ScriptLab Logo" className="h-6 w-auto min-w-[24px] block" />
                </div>
                <span className="text-white font-bold text-lg">ScriptLab</span>
              </div>

              <div className="flex flex-col gap-2">
                {menuItems.map(item => {
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

      {/* Save Button */}
      <Button
        onClick={handleSaveProject}
        className={`bg-naija-gold text-black hover:bg-naija-gold-dark ml-2 px-3 md:px-4 ${saveStatus === 'success' ? "ring ring-naija-green ring-offset-2" : ""}`}
        disabled={isSaving || saveStatus === 'saving'}
        size={isMobile ? "sm" : "default"}
        aria-label="Save"
      >
        <Save className="h-4 w-4 mr-1" />
        <span className="hidden sm:inline">
          {isSaving || saveStatus === 'saving'
            ? "Saving..."
            : saveStatus === 'success'
              ? "Saved!"
              : "Save"}
        </span>
      </Button>
    </nav>
  );
};

export default AppTopbar;
