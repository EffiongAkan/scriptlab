
import React, { useState, useEffect } from "react";
import { VersionControlPanel } from "@/components/script-editor/version-control/VersionControlPanel";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { FolderGit2 } from "lucide-react";

export default function VersionControlPage() {
  const [scripts, setScripts] = useState<{ id: string; title: string }[]>([]);
  const [selectedScriptId, setSelectedScriptId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchScripts = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("scripts")
          .select("id, title")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false });

        if (!error && data) {
          setScripts(data);
          if (data.length > 0) {
            setSelectedScriptId(data[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch scripts:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchScripts();
  }, []);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Version Control</h1>
          <p className="text-muted-foreground mt-1">Manage snapshots, history, and recovery for your scripts.</p>
        </div>

        <div className="w-full md:w-72">
          {!isLoading && scripts.length > 0 ? (
            <Select value={selectedScriptId} onValueChange={setSelectedScriptId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a script to manage" />
              </SelectTrigger>
              <SelectContent>
                {scripts.map(script => (
                  <SelectItem key={script.id} value={script.id}>
                    {script.title || "Untitled Script"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : !isLoading && scripts.length === 0 ? (
            <div className="text-sm border p-2 rounded text-muted-foreground">No scripts found</div>
          ) : (
            <div className="text-sm p-2 text-muted-foreground">Loading scripts...</div>
          )}
        </div>
      </div>

      {selectedScriptId ? (
        <VersionControlPanel scriptId={selectedScriptId} />
      ) : (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <FolderGit2 className="h-12 w-12 mb-4 opacity-20" />
            <p>Please select a script from the dropdown to view its version history.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
