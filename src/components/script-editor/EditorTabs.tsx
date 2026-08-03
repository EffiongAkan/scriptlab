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
      {/* Centered Tabs List - Allow horizontal scroll on smaller windows to prevent side-cutoff */}
      <div className="w-full bg-[#111827]/50 border-b border-white/5 py-1 flex justify-start md:justify-center overflow-x-auto no-scrollbar px-2">
        <TabsList className="bg-transparent h-10 gap-2 sm:gap-4 md:gap-8 flex-nowrap">
          <TabsTrigger 
            value="write" 
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-400 data-[state=active]:text-white data-[state=active]:bg-white/5 transition-all rounded-md"
          >
            <FileText className="h-4 w-4" />
            <span>Write</span>
          </TabsTrigger>
          <TabsTrigger 
            value="analysis" 
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-400 data-[state=active]:text-white data-[state=active]:bg-white/5 transition-all rounded-md"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Analyze</span>
          </TabsTrigger>
          <TabsTrigger 
            value="breakdown" 
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-400 data-[state=active]:text-white data-[state=active]:bg-white/5 transition-all rounded-md"
          >
            <LayoutList className="h-4 w-4" />
            <span>Breakdown</span>
          </TabsTrigger>
          <TabsTrigger 
            value="collaboration" 
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-400 data-[state=active]:text-white data-[state=active]:bg-white/5 transition-all rounded-md"
          >
            <Users className="h-4 w-4" />
            <span>Collab</span>
          </TabsTrigger>
          <TabsTrigger 
            value="share" 
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-400 data-[state=active]:text-white data-[state=active]:bg-white/5 transition-all rounded-md"
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="write" className="flex-1 h-full overflow-hidden min-h-0 m-0">
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

      <TabsContent value="analysis" className="flex-1 h-full overflow-y-auto min-h-0 m-0 p-6 bg-[#0f172a]">
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

      <TabsContent value="breakdown" className="flex-1 h-full overflow-y-auto min-h-0 m-0 p-6 bg-[#0f172a]">
        <ScriptBreakdownPanel
          elements={elements}
          title={title}
        />
      </TabsContent>

      <TabsContent value="collaboration" className="flex-1 h-full overflow-y-auto min-h-0 m-0 p-6 bg-[#0f172a]">
        <CollaborationPanel scriptId={scriptId} />
      </TabsContent>

      <TabsContent value="share" className="flex-1 h-full overflow-y-auto min-h-0 m-0 p-6 bg-[#0f172a]">
        <div className="max-w-2xl mx-auto space-y-6 text-center py-12">
          <h3 className="text-2xl font-bold text-white mb-4">Secure Sharing</h3>
          <p className="text-gray-400 mb-8 text-lg">
            Create secure share links with custom permissions, email invitations, and advanced access controls.
          </p>
          <ShareScriptModal
            scriptId={scriptId}
            scriptTitle={title}
            trigger={
              <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white px-8 h-12 text-lg">
                <Share2 className="mr-3 h-6 w-6" />
                Advanced Sharing
              </Button>
            }
          />
        </div>
      </TabsContent>
    </Tabs>
  );
};
