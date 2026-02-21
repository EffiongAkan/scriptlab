import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShareLinkManager } from './sharing/ShareLinkManager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Share2, Link, Users, Globe, Mail, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScriptSharingService } from '@/services/script-sharing-service';
import { supabase } from '@/integrations/supabase/client';

interface ShareScriptModalProps {
  scriptId: string;
  scriptTitle: string;
  trigger: React.ReactNode;
}

export const ShareScriptModal: React.FC<ShareScriptModalProps> = ({
  scriptId,
  scriptTitle,
  trigger
}) => {
  const [shareMethod, setShareMethod] = useState('link');
  const [emailList, setEmailList] = useState('');
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleEmailShare = async () => {
    if (!emailList.trim()) return;

    setSending(true);
    try {
      // Parse email list before any use
      const emails = emailList
        .split(/,|\n/)
        .map(e => e.trim())
        .filter(Boolean);

      let allShares = JSON.parse(localStorage.getItem("scriptShares") || "[]");
      let shareEntry = allShares.slice().reverse().find((s: any) => s.scriptId === scriptId);

      // Always regenerate correct share URL with current domain
      let shareUrl: string | undefined;
      if (shareEntry && shareEntry.shareToken) {
        // Always prefer current domain
        shareUrl = `${window.location.origin}/share/${shareEntry.shareToken}`;
      }
      // If no link exists yet, create a new one
      if (!shareEntry) {
        const result = await ScriptSharingService.createShareLink(scriptId, {
          type: 'email',
          accessLevel: 'read',
          allowDownload: false,
        });
        if (result.success) {
          shareEntry = { shareUrl: result.shareUrl, shareToken: result.shareToken };
          shareUrl = result.shareUrl;
        } else {
          toast({
            title: "Share link creation failed",
            description: "Could not generate a valid share link.",
            variant: "destructive",
          });
          setSending(false);
          return;
        }
      }
      // If for some reason shareUrl not set (shouldn't happen), set it now
      if (!shareUrl && shareEntry) {
        shareUrl = `${window.location.origin}/share/${shareEntry.shareToken || "unknown"}`;
      }
      if (!shareUrl) {
        toast({
          title: "Failed to generate share link.",
          description: "Please try again or refresh the page.",
          variant: "destructive",
        });
        setSending(false);
        return;
      }

      // Log for debugging
      console.log("[ShareScriptModal] Sharing via email. shareUrl:", shareUrl, "for", emails);

      // Ensure minimum email validation
      if (!emails.length || !emails.every(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))) {
        toast({
          title: "Invalid email(s)",
          description: "Please enter valid comma- or line-separated emails.",
          variant: "destructive",
        });
        setSending(false);
        return;
      }

      // Use Supabase client to invoke the function (handles auth and URL automatically)
      const { data: result, error } = await supabase.functions.invoke('send-invite-email', {
        body: {
          to: emails,
          shareUrl,
          scriptTitle,
        },
      });

      if (error) {
        console.error("Function invocation error:", error);
        throw error;
      }

      // Check for application-level error returned by the function
      if (result && result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Invitations sent!",
        description: `Share invitations sent to ${emails.length} recipient${emails.length > 1 ? 's' : ''}`,
      });
      setEmailList("");
      // Success path ends here
      setSending(false);
      return;

    } catch (e: any) {
      console.error("ShareScriptModal email error details:", e);
      toast({
        title: "Error sending invitations",
        description: e.message || "Unable to send invitations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const generateQRCode = () => {
    toast({
      title: "QR Code Generated",
      description: "QR code created for easy mobile sharing",
    });
  };

  const handlePublicShare = () => {
    toast({
      title: "Public Link Created",
      description: "Your script is now publicly accessible",
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Script - {scriptTitle}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="links" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="links" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Share Links
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="public" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Public
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              Advanced
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 max-h-[calc(90vh-120px)] overflow-y-auto">
            <TabsContent value="links">
              <ShareLinkManager
                scriptId={scriptId}
                scriptTitle={scriptTitle}
              />
            </TabsContent>

            <TabsContent value="email">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Invitations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Email Addresses</label>
                    <textarea
                      className="w-full mt-1 p-3 border rounded-lg"
                      rows={4}
                      placeholder="Enter email addresses separated by commas or new lines..."
                      value={emailList}
                      onChange={(e) => setEmailList(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Example: director@company.com, producer@studio.com
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleEmailShare} disabled={!emailList.trim() || sending}>
                      <Mail className="h-4 w-4 mr-2" />
                      {sending ? "Sending..." : "Send Invitations"}
                    </Button>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Email Templates</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm">Director Review</Button>
                      <Button variant="outline" size="sm">Producer Feedback</Button>
                      <Button variant="outline" size="sm">Cast Read-Through</Button>
                      <Button variant="outline" size="sm">General Collaboration</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="public">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Public Sharing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Public Access</span>
                    </div>
                    <p className="text-sm text-yellow-700">
                      Making your script public will allow anyone with the link to view it.
                      This cannot be undone easily.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Public Read-Only Access</div>
                        <div className="text-sm text-muted-foreground">
                          Anyone can view but not edit your script
                        </div>
                      </div>
                      <Button variant="outline" onClick={handlePublicShare}>
                        Enable Public Access
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Search Engine Indexing</div>
                        <div className="text-sm text-muted-foreground">
                          Allow search engines to find your script
                        </div>
                      </div>
                      <Button variant="outline" disabled>
                        Enable Indexing
                      </Button>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Social Media Sharing</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" size="sm">Twitter</Button>
                      <Button variant="outline" size="sm">LinkedIn</Button>
                      <Button variant="outline" size="sm">Facebook</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <QrCode className="h-5 w-5" />
                      QR Code Sharing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <div className="w-48 h-48 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg mx-auto mb-4 flex items-center justify-center">
                        <QrCode className="h-16 w-16 text-gray-400" />
                      </div>
                      <Button onClick={generateQRCode}>
                        Generate QR Code
                      </Button>
                      <p className="text-sm text-muted-foreground mt-2">
                        Perfect for sharing during presentations or meetings
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Embed Options</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Embed Code</label>
                        <div className="mt-1 p-3 bg-gray-50 rounded border font-mono text-sm">
                          {`<iframe src="https://scriptforge.app/embed/${scriptId}" width="100%" height="600"></iframe>`}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Copy Embed Code
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
