import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScriptContentContainer } from "./ScriptContentContainer";
import { ScriptAnalysisTabContent } from "./ScriptAnalysisTabContent";
import { CollaborationPanel } from "./CollaborationPanel";
import { ShareScriptModal } from "./ShareScriptModal";
import { FileText, BarChart3, Users, Share2, LayoutList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScriptBreakdownPanel } from "./analysis/ScriptBreakdownPanel";

interface EditorTabsProps {
  scriptId: string;
  title: string;
  elements: any[];
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onContentChange?: () => void;
  onApplySuggestion?: (elementId: string, newContent: string) => void;
  onApplyAllSuggestions?: (suggestions: Array<{ elementId: string; content: string }>) => void;
  onImplementAllSuggestions?: (updatedElements: any[]) => void;
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
  onImplementAllSuggestions,
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
      {/* Mobile: Compress TabsList, Desktop: Normal TabsList */}
      <div className="overflow-x-auto bg-[#1E1E1E] md:bg-transparent border-b border-gray-800 md:border-none">
        <TabsList className="grid w-full min-w-fit grid-cols-5 h-auto p-0 md:p-1 bg-transparent md:bg-muted">
          <TabsTrigger value="write" className="flex items-center gap-1 md:gap-2 px-1 py-1.5 md:px-3 md:py-2 text-[10px] md:text-sm data-[state=active]:bg-gray-800 md:data-[state=active]:bg-background">
            <FileText className="h-3 w-3 md:h-4 md:w-4" />
            <span className="inline-block md:inline">Write</span>
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-1 md:gap-2 px-1 py-1.5 md:px-3 md:py-2 text-[10px] md:text-sm data-[state=active]:bg-gray-800 md:data-[state=active]:bg-background">
            <BarChart3 className="h-3 w-3 md:h-4 md:w-4" />
            <span className="inline-block md:inline">Analyze</span>
          </TabsTrigger>
          <TabsTrigger value="breakdown" className="flex items-center gap-1 md:gap-2 px-1 py-1.5 md:px-3 md:py-2 text-[10px] md:text-sm data-[state=active]:bg-gray-800 md:data-[state=active]:bg-background">
            <LayoutList className="h-3 w-3 md:h-4 md:w-4" />
            <span className="inline-block md:inline">Breakdown</span>
          </TabsTrigger>

          <TabsTrigger value="collaboration" className="flex items-center gap-1 md:gap-2 px-1 py-1.5 md:px-3 md:py-2 text-[10px] md:text-sm data-[state=active]:bg-gray-800 md:data-[state=active]:bg-background">
            <Users className="h-3 w-3 md:h-4 md:w-4" />
            <span className="inline-block md:inline">Collab</span>
          </TabsTrigger>
          <TabsTrigger value="share" className="flex items-center gap-1 md:gap-2 px-1 py-1.5 md:px-3 md:py-2 text-[10px] md:text-sm data-[state=active]:bg-gray-800 md:data-[state=active]:bg-background">
            <Share2 className="h-3 w-3 md:h-4 md:w-4" />
            <span className="inline-block md:inline">Share</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="write" className="mt-0 md:mt-4 flex-1 h-full overflow-hidden min-h-0">
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

      <TabsContent value="analysis" className="mt-0 md:mt-4 flex-1 h-full overflow-y-auto min-h-0">
        <ScriptAnalysisTabContent
          elements={elements}
          onApplySuggestion={onApplySuggestion}
          onImplementAllSuggestions={onImplementAllSuggestions}
          genre={genre}
          language={language}
          synopsis={synopsis}
          industry={industry}
        />
      </TabsContent>

      <TabsContent value="breakdown" className="mt-0 md:mt-4 flex-1 h-full overflow-y-auto min-h-0">
        <ScriptBreakdownPanel
          elements={elements}
          title={title}
        />
      </TabsContent>



      <TabsContent value="collaboration" className="mt-2 md:mt-6">
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
