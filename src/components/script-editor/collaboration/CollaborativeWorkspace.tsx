
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, MessageCircle, Activity, Settings } from 'lucide-react';
import { LiveCursorSystem } from './LiveCursorSystem';
import { RealtimeComments } from './RealtimeComments';
import { EnhancedPresenceIndicator } from './EnhancedPresenceIndicator';
import { ActivityFeed } from './ActivityFeed';
// import { CollaborationPanel } from '../CollaborationPanel'; // Removed circular dependency
import { useScriptEditor } from '@/contexts/ScriptEditorContext';

interface CollaborativeWorkspaceProps {
  scriptId: string;
  currentUserId?: string;
}

export const CollaborativeWorkspace: React.FC<CollaborativeWorkspaceProps> = ({
  scriptId,
  currentUserId
}) => {
  const { focusedElementId } = useScriptEditor();
  const [showCursors, setShowCursors] = React.useState(true);

  return (
    <div className="space-y-6">
      {/* Live Cursor System - Rendered globally if enabled */}
      {showCursors && (
        <LiveCursorSystem scriptId={scriptId} currentUserId={currentUserId} />
      )}

      {/* Enhanced Presence Indicator */}
      <EnhancedPresenceIndicator scriptId={scriptId} currentUserId={currentUserId} />

      {/* Collaboration Tabs */}
      <Tabs defaultValue="comments" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comments" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Comments
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            My Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comments" className="mt-4">
          <RealtimeComments
            scriptId={scriptId}
            selectedElementId={focusedElementId || undefined}
          />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <ActivityFeed scriptId={scriptId} />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Workspace Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Show Collaborator Cursors</label>
                  <p className="text-xs text-muted-foreground">
                    See where others are typing in real-time
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={showCursors}
                  onChange={(e) => setShowCursors(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 accent-primary"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Highlight Active Paragraph</label>
                  <p className="text-xs text-muted-foreground">
                    Subtly highlight the element you are currently editing
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-gray-300 accent-primary"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Comment Indicators</label>
                  <p className="text-xs text-muted-foreground">
                    Show icons in the margin for lines with comments
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-gray-300 accent-primary"
                />
              </div>

              <div className="pt-4 border-t">
                <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Notifications</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm">New Comment Alerts</label>
                    <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 accent-primary" />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm">Collaborator Join/Leave</label>
                    <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 accent-primary" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
