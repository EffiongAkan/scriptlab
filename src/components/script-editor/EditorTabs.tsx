import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScriptContentContainer } from "./ScriptContentContainer";
import { ScriptAnalysisTabContent } from "./ScriptAnalysisTabContent";
import { CollaborationPanel } from "./CollaborationPanel";
import { ShareScriptModal } from "./ShareScriptModal";
import { FileText, BarChart3, Users, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditorTabsProps {
  scriptId: string;
  title: string;
  elements: any[];
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onContentChange?: () => void;
  onApplySuggestion?: (elementId: string, newContent: string) => void;
  onApplyAllSuggestions?: (suggestions: Array<{ elementId: string; content: string }>) => void;
  onTabChange?: (tab: string) => void;
  isSaving?: boolean;
  lastSavedAt?: Date | null;
  hasUnsavedChanges?: boolean;
  genre?: any;
  language?: any;
  synopsis?: string;
  industry?: string;
}

export const EditorTabs = ({
  scriptId,
  title,
  elements,
  onTitleChange,
  onContentChange,
  onApplySuggestion,
  onApplyAllSuggestions,
  onTabChange,
  isSaving = false,
  lastSavedAt,
  hasUnsavedChanges = false,
  genre,
  language,
  synopsis,
  industry
}: EditorTabsProps) => {
  return (
    <Tabs defaultValue="write" onValueChange={onTabChange} className="w-full h-full flex flex-col">
      <div className="overflow-x-auto">
        <TabsList className="grid w-full min-w-fit grid-cols-4 h-auto p-1">
          <TabsTrigger value="write" className="flex items-center gap-2 px-3 py-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Write</span>
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2 px-3 py-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analysis</span>
          </TabsTrigger>

          <TabsTrigger value="collaboration" className="flex items-center gap-2 px-3 py-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Collaborate</span>
          </TabsTrigger>
          <TabsTrigger value="share" className="flex items-center gap-2 px-3 py-2">
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="write" className="mt-4 flex-1 h-full overflow-hidden min-h-0">
        <ScriptContentContainer
          title={title}
          scriptId={scriptId}
          elements={elements}
          onTitleChange={onTitleChange}
          onContentChange={onContentChange}
          isSaving={isSaving}
          lastSavedAt={lastSavedAt}
          hasUnsavedChanges={hasUnsavedChanges}
        />
      </TabsContent>

      <TabsContent value="analysis" className="mt-4 flex-1 h-full overflow-y-auto min-h-0">
        <ScriptAnalysisTabContent
          elements={elements}
          onApplySuggestion={onApplySuggestion}
          genre={genre}
          language={language}
          synopsis={synopsis}
          industry={industry}
        />
      </TabsContent>



      <TabsContent value="collaboration" className="mt-6">
        <CollaborationPanel scriptId={scriptId} />
      </TabsContent>



      <TabsContent value="share" className="mt-6">
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">Enhanced Sharing System</h3>
            <p className="text-muted-foreground mb-6">
              Create secure share links with custom permissions, email invitations, and advanced access controls.
              Manage collaborator access and track engagement.
            </p>
            <ShareScriptModal
              scriptId={scriptId}
              scriptTitle={title}
              trigger={
                <Button size="lg" className="min-w-[200px]">
                  <Share2 className="mr-2 h-5 w-5" />
                  Advanced Sharing
                </Button>
              }
            />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};
