import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScriptCard } from "@/components/dashboard/ScriptCard";
import { FileText, BookOpen, Users, Upload } from "lucide-react";
import { v4 as uuid } from "uuid";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { SynopsisCard } from "@/components/dashboard/SynopsisCard";
import { CharacterCardLite } from "@/components/dashboard/CharacterCardLite";
import { fetchUserSynopses } from "@/services/synopsis-service";
import { fetchUserSavedCharacters } from "@/services/character-save-service";
import { ScriptCreationDialog } from "@/components/common/ScriptCreationDialog";
import { ScriptUploadDialog } from "@/components/dashboard/ScriptUploadDialog";
import { UserProfileCard } from "@/components/dashboard/UserProfileCard";

// Define simplified Script type for Dashboard use
interface DashboardScript {
  id: string;
  title: string;
  genre?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [scripts, setScripts] = useState<DashboardScript[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sharedScripts, setSharedScripts] = useState<DashboardScript[]>([]);
  const [isLoadingShared, setIsLoadingShared] = useState(true);
  const [scriptStats, setScriptStats] = useState({
    totalScripts: 0,
    totalCharacters: 0,
    totalScenes: 0,
    totalSynopses: 0,
    lastActive: 'Today'
  });
  const [synopses, setSynopses] = useState([]);
  const [savedCharacters, setSavedCharacters] = useState([]);
  const [showScriptCreationDialog, setShowScriptCreationDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  useEffect(() => {
    const fetchScripts = async () => {
      try {
        setIsLoading(true);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({
            title: "Authentication required",
            description: "Please login to view your scripts",
            variant: "destructive"
          });
          navigate("/auth");
          return;
        }

        // Fetch user's scripts
        const { data: scriptsData, error: scriptsError } = await supabase
          .from('scripts')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (scriptsError) {
          console.error('Error fetching scripts:', scriptsError);
          toast({
            title: "Error",
            description: "Failed to load scripts",
            variant: "destructive"
          });
        } else if (scriptsData) {
          setScripts(scriptsData as DashboardScript[]);
          setScriptStats(prev => ({
            ...prev,
            totalScripts: scriptsData.length
          }));
        }

        // Fetch character count - fix: use .in() with array of script IDs
        if (scriptsData && scriptsData.length > 0) {
          const scriptIds = scriptsData.map(s => s.id);
          const { count: characterCount, error: characterError } = await supabase
            .from('characters')
            .select('*', { count: 'exact', head: true })
            .in('script_id', scriptIds);

          if (!characterError && characterCount !== null) {
            setScriptStats(prev => ({
              ...prev,
              totalCharacters: characterCount
            }));
          }

          // Fetch scenes count - fix: use .in() with array of script IDs
          const { count: scenesCount, error: scenesError } = await supabase
            .from('scenes')
            .select('*', { count: 'exact', head: true })
            .in('script_id', scriptIds);

          if (!scenesError && scenesCount !== null) {
            setScriptStats(prev => ({
              ...prev,
              totalScenes: scenesCount
            }));
          }
        }

        // Fetch synopses count
        const { count: synopsesCount, error: synopsesError } = await supabase
          .from('synopses')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        if (!synopsesError && synopsesCount !== null) {
          setScriptStats(prev => ({
            ...prev,
            totalSynopses: synopsesCount
          }));
        }

        // Check last activity
        if (scriptsData && scriptsData.length > 0) {
          const lastUpdated = new Date(scriptsData[0].updated_at);
          const today = new Date();
          const diffDays = Math.floor((today.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays === 0) {
            setScriptStats(prev => ({ ...prev, lastActive: 'Today' }));
          } else if (diffDays === 1) {
            setScriptStats(prev => ({ ...prev, lastActive: 'Yesterday' }));
          } else {
            setScriptStats(prev => ({ ...prev, lastActive: `${diffDays} days ago` }));
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    const fetchSharedScripts = async () => {
      try {
        setIsLoadingShared(true);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setSharedScripts([]);
          return;
        }

        // Get scripts where user is a collaborator (not the owner)
        const { data, error } = await supabase
          .from('script_collaborators')
          .select(`
            script_id,
            role,
            created_at,
            scripts (
              id,
              title,
              genre,
              description,
              created_at,
              updated_at,
              user_id
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching shared scripts:', error);
          toast({
            title: "Error",
            description: "Failed to load shared scripts",
            variant: "destructive"
          });
          setSharedScripts([]);
          return;
        }

        // Transform data and filter out scripts owned by user
        const sharedScriptsData = (data || [])
          .filter(item => item.scripts && item.scripts.user_id !== user.id) // Exclude owned scripts
          .map(item => item.scripts as DashboardScript)
          .filter(Boolean);

        console.log('Shared scripts loaded:', sharedScriptsData.length);
        setSharedScripts(sharedScriptsData);
      } catch (error) {
        console.error("Error fetching shared scripts:", error);
        setSharedScripts([]);
      } finally {
        setIsLoadingShared(false);
      }
    };

    fetchScripts();
    fetchSharedScripts();
  }, [toast, navigate]);

  useEffect(() => {
    const fetchExtraContent = async () => {
      try {
        // Get user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch synopses directly with proper error handling
        const { data: synopsesData, error: synopsesError } = await supabase
          .from('synopses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (synopsesError) {
          console.error('Error fetching synopses:', synopsesError);
        } else {
          setSynopses(synopsesData || []);
        }

        // Fetch saved characters directly with proper error handling
        const { data: charactersData, error: charactersError } = await supabase
          .from('saved_characters')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (charactersError) {
          console.error('Error fetching saved characters:', charactersError);
        } else {
          setSavedCharacters(charactersData || []);
        }
      } catch (err) {
        console.error('Error in fetchExtraContent:', err);
      }
    };

    fetchExtraContent();
  }, []);

  const handleCreateNewScript = () => {
    setShowScriptCreationDialog(true);
  };

  const handleUploadScript = () => {
    setShowUploadDialog(true);
  };

  const handleGenerateAIContent = (contentType: string) => {
    toast({
      title: "AI Assistant",
      description: `Generating ${contentType}...`
    });

    // In a real implementation, this would call an AI service
    setTimeout(() => {
      toast({
        title: "AI Suggestions Ready",
        description: `Check your ${contentType} suggestions in the editor`
      });
    }, 1500);
  };

  const handleRefreshSynopses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: synopsesData, error } = await supabase
          .from('synopses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error refreshing synopses:', error);
        } else {
          setSynopses(synopsesData || []);
        }
      }
    } catch (error) {
      console.error('Error refreshing synopses:', error);
    }
  };

  const renderScriptCards = (scripts: DashboardScript[]) => {
    return scripts.map(script => (
      <ScriptCard
        key={script.id}
        script={script}
        onUpdate={() => {
          // Re-fetch everything to ensure sync
          // We can't easily call fetchScripts directly as it's in useEffect
          // But we can force a re-render or trigger a state update
          // A specialized refresh function would be better, but triggering navigate(0) is a hard refresh
          // or we can refactor fetchScripts out.

          // Better approach: Since fetchScripts is inside useEffect with no deps we can't call it.
          // Let's rely on window.location.reload() for a hard sync or refactor.
          // Refactoring is cleaner.
          navigate(0);
        }}
      />
    ));
  };

  const renderLoadingSkeletons = () => {
    return [1, 2, 3].map(i => (
      <Card key={i} className="overflow-hidden transition-all duration-300">
        <div className="h-1 bg-gray-200 w-full"></div>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-3/4" />
        </CardHeader>
        <CardContent className="text-sm">
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
        <CardFooter className="pt-2 border-t">
          <Skeleton className="h-8 w-16" />
        </CardFooter>
      </Card>
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-400">Your Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={handleUploadScript} variant="outline" className="border-naija-green text-naija-green hover:bg-naija-green/10">
            <Upload className="mr-2 h-4 w-4" />
            Upload Script
          </Button>
          <Button onClick={handleCreateNewScript} className="bg-naija-green hover:bg-naija-green-dark text-white">
            New Script
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Profile Card */}
        <div className="lg:col-span-1">
          <UserProfileCard />
        </div>

        {/* Stats Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="">
            <CardTitle>Creative Stats</CardTitle>
            <CardDescription>Your professional writing activity summary</CardDescription>
          </CardHeader>
          <CardContent className="">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-naija-green/10 rounded-lg p-4">
                <p className="text-sm font-medium text-naija-green-dark">Total Scripts</p>
                <p className="text-3xl font-bold text-naija-green">{scriptStats.totalScripts}</p>
              </div>
              <div className="bg-naija-gold/10 rounded-lg p-4">
                <p className="text-sm font-medium text-naija-earth">Characters</p>
                <p className="text-3xl font-bold text-naija-gold-dark">{scriptStats.totalCharacters}</p>
              </div>
              <div className="bg-naija-accent/10 rounded-lg p-4">
                <p className="text-sm font-medium text-naija-accent">Scenes Written</p>
                <p className="text-3xl font-bold text-naija-accent">{scriptStats.totalScenes}</p>
              </div>
              <div className="bg-blue-100 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-600">Synopses</p>
                <p className="text-3xl font-bold text-blue-800">{scriptStats.totalSynopses}</p>
              </div>
            </div>
            <div className="mt-4 bg-gray-100 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-600">Last Active</p>
              <p className="text-lg font-bold text-gray-800">{scriptStats.lastActive}</p>
            </div>
          </CardContent>
        </Card>


      </div>

      <Tabs defaultValue="recent" className="w-full">
        <TabsList className="mb-6 w-full sm:w-auto flex overflow-x-auto sm:overflow-visible">
          <TabsTrigger value="recent" className="flex-1 sm:flex-auto">Recent Scripts</TabsTrigger>
          <TabsTrigger value="all" className="flex-1 sm:flex-auto">All Scripts</TabsTrigger>
          <TabsTrigger value="shared" className="flex-1 sm:flex-auto">Shared With Me</TabsTrigger>
          <TabsTrigger value="generated" className="flex-1 sm:flex-auto">AI Generated</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? renderLoadingSkeletons() : scripts.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-300 mb-2">No scripts yet</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  Create your first professional script to start writing your screenplay
                </p>
                <Button onClick={handleCreateNewScript} className="mt-4 bg-naija-green hover:bg-naija-green-dark text-white">
                  Create Professional Script
                </Button>
              </div>
            ) : renderScriptCards(scripts.slice(0, 6))}
          </div>
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? renderLoadingSkeletons() : scripts.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-300 mb-2">No scripts yet</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  Create your first professional script to start writing your screenplay
                </p>
                <Button onClick={handleCreateNewScript} className="mt-4 bg-naija-green hover:bg-naija-green-dark text-white">
                  Create Professional Script
                </Button>
              </div>
            ) : renderScriptCards(scripts)}
          </div>
        </TabsContent>

        <TabsContent value="shared" className="mt-6">
          {isLoadingShared ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderLoadingSkeletons()}
            </div>
          ) : sharedScripts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No shared scripts yet</h3>
              <p className="text-sm text-gray-500 max-w-md mt-1">
                When someone shares a script with you, it will appear here for collaborative editing.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderScriptCards(sharedScripts)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="generated" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Professional Treatments Panel */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-5 w-5 text-naija-green-dark" />
                <div className="text-lg font-semibold text-naija-green-dark">Professional Treatments & Synopses</div>
              </div>
              {synopses.length === 0 ? (
                <div className="text-gray-400 px-2 py-8 text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No generated treatments yet.</p>
                  <p className="text-sm mt-1">Use AI Script Generator to create professional treatments.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {synopses.map((syn: any) => (
                    <SynopsisCard
                      key={syn.id}
                      id={syn.id}
                      title={syn.title}
                      content={syn.content}
                      createdAt={syn.created_at}
                      onUpdate={handleRefreshSynopses}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Characters Panel */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-naija-gold-dark" />
                <div className="text-lg font-semibold text-naija-gold-dark">Generated Characters</div>
              </div>
              {savedCharacters.length === 0 ? (
                <div className="text-gray-400 px-2 py-8 text-center">
                  <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No generated characters yet.</p>
                  <p className="text-sm mt-1">Save characters from your AI-generated treatments.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {savedCharacters.map((char: any) => (
                    <CharacterCardLite
                      key={char.id}
                      name={char.name}
                      description={char.description}
                      background={char.background}
                      traits={char.traits}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <ScriptCreationDialog
        open={showScriptCreationDialog}
        onOpenChange={setShowScriptCreationDialog}
      />

      <ScriptUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
      />
    </div>
  );
}
