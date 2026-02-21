
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScriptPaper } from "@/components/ui/script-paper";
import { ScriptSharingService } from "@/services/script-sharing-service";
import { Loader, AlertCircle, MessageSquare, LogIn, FileText, Send, X, User, Quote, MousePointerClick } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface SharedScript {
  id: string;
  title: string;
  description?: string;
  genre?: string;
  language?: string;
  script_elements?: Array<{
    id: string;
    type: string;
    content: string;
    position: number;
  }>;
}

interface ShareInfo {
  access_level: string;
  expires_at?: string;
  allow_download?: boolean;
  access_count: number;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  guest_name?: string;
  user_id?: string;
  profiles?: {
    username: string;
    avatar_url?: string;
  };
}

export default function SharedScriptReader() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const [script, setScript] = useState<SharedScript | null>(null);
  const [shareInfo, setShareInfo] = useState<ShareInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  // Commenting State
  const [comments, setComments] = useState<Comment[]>([]);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [guestName, setGuestName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selection State
  const [selection, setSelection] = useState<{
    text: string;
    top: number;
    left: number;
    elementId?: string;
  } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    if (!shareToken) {
      setError("Invalid share link");
      setLoading(false);
      return;
    }
    fetchSharedScript();

    // Selection listener
    const handleSelection = () => {
      const selectionObj = window.getSelection();
      if (!selectionObj || selectionObj.isCollapsed) {
        setSelection(null);
        return;
      }

      const range = selectionObj.getRangeAt(0);
      const text = selectionObj.toString().trim();

      if (!text) return;

      // Find parent with data-element-id
      let container = range.commonAncestorContainer as HTMLElement;
      if (container.nodeType === 3) container = container.parentElement as HTMLElement;

      const elementNode = container.closest('[data-element-id]');
      const elementId = elementNode?.getAttribute('data-element-id') || undefined;

      const rect = range.getBoundingClientRect();

      // Calculate position relative to viewport but adjust for scroll if needed
      // Actually fixed position is easiest for floating button
      setSelection({
        text,
        top: rect.top - 40, // Position above selection
        left: rect.left + (rect.width / 2) - 20, // Center horizontally
        elementId
      });
    };

    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, [shareToken]);

  const fetchSharedScript = async () => {
    try {
      const result = await ScriptSharingService.getSharedScript(shareToken!);
      if (!result) {
        setError("This share link is invalid or has expired.");
        return;
      }
      setScript(result.script);
      setShareInfo(result.shareInfo);

      // Fetch comments if script is loaded
      if (result.script?.id) {
        loadComments(result.script.id);
      }
    } catch (error) {
      console.error('Error fetching shared script:', error);
      setError("Could not load script data.");
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async (scriptId: string) => {
    const fetchedComments = await ScriptSharingService.getComments(scriptId);
    setComments(fetchedComments);
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    if (!user && !guestName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name to post as a guest.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Use selected element ID if available (captured in comment potentially?)
      // For now we still default to first element if not specific, but the text is quoted.
      // Ideally we should pass the elementId from the selection if we stored it stash-wise when opening the sheet.
      // But for simplicity, we attach to first element or a default common one.
      const firstElementId = script?.script_elements?.[0]?.id;

      if (!firstElementId) {
        toast({ title: "Error", description: "Cannot comment on an empty script.", variant: "destructive" });
        return;
      }

      const result = await ScriptSharingService.addComment(
        script!.id,
        newComment,
        firstElementId, // Attaching to first element as 'general' comment for now
        guestName || undefined
      );

      if (result.success) {
        setNewComment("");
        // Reload comments
        loadComments(script!.id);
        toast({ title: "Comment posted!" });
      } else {
        throw new Error("Failed to post");
      }
    } catch (err) {
      toast({
        title: "Error posting comment",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuoteSelection = () => {
    if (selection) {
      setNewComment(prev => `> "${selection.text}"\n\n${prev}`);
      setIsCommentsOpen(true);
      setSelection(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-slate-400" />
        <span className="mt-4 text-slate-500 font-medium">Loading script...</span>
      </div>
    );
  }

  if (error || !script) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Unable to View Script</h2>
          <p className="text-slate-500 mb-6">{error || "Script not found"}</p>
          <Link to="/">
            <Button variant="outline">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const sortedElements = script.script_elements?.sort((a, b) => a.position - b.position) || [];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-950 relative overflow-hidden">
      {/* Cinematic Spotlight Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(120,119,198,0.3),_transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,_transparent_0%,_#020617_100%)]" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Minimal Header */}
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-white/10 px-6 py-3 flex items-center justify-between shadow-sm supports-[backdrop-filter]:bg-white/60">
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-2 rounded">
              <FileText className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <h1 className="font-extrabold text-xl text-slate-950 leading-tight" style={{ color: '#000000', opacity: 1 }}>{script.title}</h1>
              <p className="text-xs text-slate-500 font-medium">Read-Only View • {sortedElements.length} scenes</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Sheet open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="relative">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Comments
                  <span className="ml-2 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                    {comments.length}
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:w-[540px] flex flex-col bg-slate-950 border-l border-slate-800 text-slate-200">
                <SheetHeader className="border-b border-slate-800 pb-4 bg-slate-950 -mx-6 px-6 pt-6">
                  <SheetTitle className="flex items-center gap-2 text-white">
                    <MessageSquare className="h-5 w-5 text-indigo-400" />
                    Comments <span className="text-slate-500 text-sm font-normal">({comments.length})</span>
                  </SheetTitle>
                </SheetHeader>

                <ScrollArea className="flex-1 -mx-6 px-6">
                  <div className="space-y-6 py-6">
                    {comments.length === 0 ? (
                      <div className="text-center py-20 text-slate-500 flex flex-col items-center">
                        <div className="bg-slate-900 p-4 rounded-full mb-3 border border-slate-800">
                          <MessageSquare className="h-8 w-8 text-slate-600" />
                        </div>
                        <p className="font-medium text-slate-400">No comments yet</p>
                        <p className="text-sm">Be the first to share your thoughts!</p>
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 group animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <Avatar className="h-8 w-8 border border-slate-700 shadow-sm shrink-0">
                            <AvatarImage src={comment.profiles?.avatar_url} />
                            <AvatarFallback className={`text - xs font - bold ${comment.user_id ? "bg-indigo-900/50 text-indigo-300 border border-indigo-800" : "bg-slate-800 text-slate-400 border border-slate-700"} `}>
                              {(comment.profiles?.username || comment.guest_name || "?").charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`text - sm font - bold ${comment.user_id ? "text-indigo-300" : "text-slate-300"} `}>
                                  {comment.profiles?.username || comment.guest_name || "Guest"}
                                </span>
                                {!comment.user_id && (
                                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">Guest</span>
                                )}
                              </div>
                              <span className="text-xs text-slate-600 font-medium">
                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            <div className="bg-slate-900/50 p-3 rounded-lg rounded-tl-none border border-slate-800 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                              {comment.content}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>

                <div className="mt-auto pt-4 border-t border-slate-800 bg-slate-950 -mx-6 px-6 pb-6">
                  {user ? (
                    <div className="mb-4 bg-emerald-950/30 p-3 rounded-lg border border-emerald-500/30 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-900/50 flex items-center justify-center text-emerald-400 border border-emerald-500/50">
                        {user.email?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-400 uppercase">Logged In</p>
                        <p className="text-sm text-emerald-200 truncate max-w-[200px]">{user.email}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 bg-indigo-950/30 p-4 rounded-lg border border-indigo-500/30">
                      <label className="text-xs font-bold text-indigo-400 uppercase mb-2 block flex items-center gap-2">
                        <User className="h-3 w-3" /> Step 1: Your Name (Required)
                      </label>
                      <Input
                        placeholder="Enter your name here..."
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-400 focus-visible:ring-indigo-500 font-medium shadow-sm"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    {!user && <label className="text-xs font-bold text-slate-500 uppercase">Step 2: Your Comment</label>}
                    <div className="flex gap-2">
                      <Input
                        placeholder={user ? "Write a comment..." : "Type your feedback here..."}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handlePostComment()}
                        className="flex-1 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
                      />
                      <Button
                        onClick={handlePostComment}
                        disabled={isSubmitting || !newComment.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm border border-transparent"
                      >
                        {isSubmitting ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {!user ? (
              <Link to="/auth">
                <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 border border-white shadow-sm" title={user.email}>
                {user.email?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </header>

        {/* Script Content Area */}
        <main className="flex-1 overflow-y-auto py-8 px-4" onScroll={() => setSelection(null)}>
          <ScriptPaper className="shadow-lg mx-auto bg-white min-h-[297mm] p-[25mm] font-mono text-lg transition-all duration-300 relative">
            {sortedElements.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-20">
                <p className="italic">This script is empty.</p>
              </div>
            ) : (
              <div className="space-y-4 font-['Courier_Prime','Courier_New',monospace] text-black leading-relaxed">
                {sortedElements.map((element) => {
                  let className = "whitespace-pre-wrap select-text transition-colors duration-200 hover:bg-blue-50/50 rounded px-1 -mx-1";

                  switch (element.type) {
                    case "scene_heading":
                    case "heading":
                      className += " font-bold uppercase mt-8 mb-4";
                      break;
                    case "action":
                      className += " mb-4";
                      break;
                    case "character":
                      className += " uppercase mt-6 mb-0 ml-[37%] w-[60%]";
                      break;
                    case "dialogue":
                      className += " ml-[25%] mr-[25%] mb-4";
                      break;
                    case "parenthetical":
                      className += " ml-[30%] mr-[30%] -mt-2 mb-0 italic";
                      break;
                    case "transition":
                      className += " text-right uppercase mt-4 mb-4";
                      break;
                    default:
                      className += " mb-4";
                  }

                  return (
                    <div key={element.id} className={className} data-element-id={element.id}>
                      {element.content}
                    </div>
                  );
                })}
              </div>
            )}
          </ScriptPaper>
        </main>

        {/* Floating Comment Button */}
        {selection && (
          <div
            className="fixed z-50 animate-in zoom-in duration-200"
            style={{ top: selection.top, left: selection.left }}
          >
            <Button
              size="sm"
              onClick={handleQuoteSelection}
              className="rounded-full shadow-xl bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-white"
            >
              <Quote className="h-4 w-4 mr-1" />
              Quote & Comment
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

