import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Send, Loader, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface Comment {
    id: string;
    content: string;
    created_at: string;
    guest_name?: string;
    user_id?: string;
    profiles?: {
        username: string;
        avatar_url?: string;
    };
    author?: { // Support both structures
        name: string;
        avatar?: string;
    };
}

interface ScriptCommentsSidebarProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    comments: Comment[];
    user: any;
    guestName?: string;
    setGuestName?: (name: string) => void;
    newComment: string;
    setNewComment: (comment: string) => void;
    onPostComment: () => void;
    isSubmitting: boolean;
}

export const ScriptCommentsSidebar = ({
    isOpen,
    onOpenChange,
    comments,
    user,
    guestName,
    setGuestName,
    newComment,
    setNewComment,
    onPostComment,
    isSubmitting,
}: ScriptCommentsSidebarProps) => {
    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-[400px] flex flex-col bg-slate-950 border-l border-slate-800 text-slate-200" side="right">
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
                            comments.map((comment) => {
                                const displayName = comment.profiles?.username || comment.guest_name || comment.author?.name || "Guest";
                                const avatarUrl = comment.profiles?.avatar_url || comment.author?.avatar;

                                return (
                                    <div key={comment.id} className="flex gap-3 group animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <Avatar className="h-8 w-8 border border-slate-700 shadow-sm shrink-0">
                                            <AvatarImage src={avatarUrl} />
                                            <AvatarFallback className={`text-xs font-bold ${comment.user_id ? "bg-indigo-900/50 text-indigo-300 border border-indigo-800" : "bg-slate-800 text-slate-400 border border-slate-700"}`}>
                                                {displayName.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-bold ${comment.user_id ? "text-indigo-300" : "text-slate-300"}`}>
                                                        {displayName}
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
                                );
                            })
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
                                onChange={(e) => setGuestName?.(e.target.value)}
                                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-400 focus-visible:ring-indigo-500 font-medium shadow-sm"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        {!user && <label className="text-xs font-bold text-slate-500 uppercase">Step 2: Your Comment</label>}
                        <div className="flex gap-2">
                            <Input
                                placeholder={user ? "Write a comment... (Tip: Highlight text to quote)" : "Type your feedback here..."}
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onPostComment()}
                                className="flex-1 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
                            />
                            <Button
                                onClick={onPostComment}
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
    );
};
