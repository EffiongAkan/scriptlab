
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Reply, Trash2, Edit3, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useScriptComments, Comment } from '@/hooks/useScriptComments';

interface RealtimeCommentsProps {
  scriptId: string;
  selectedElementId?: string;
  onCommentAdd?: (elementId: string, comment: string) => void;
}

export const RealtimeComments: React.FC<RealtimeCommentsProps> = ({
  scriptId,
  selectedElementId,
  onCommentAdd
}) => {
  const [newComment, setNewComment] = useState('');
  const [replyToComment, setReplyToComment] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  // Use real database hook instead of mock data
  const {
    comments,
    isLoading,
    addComment,
    addReply,
    deleteComment,
    toggleResolved
  } = useScriptComments(scriptId, selectedElementId);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await addComment(newComment, selectedElementId);
      setNewComment('');

      if (onCommentAdd && selectedElementId) {
        onCommentAdd(selectedElementId, newComment);
      }
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleReply = async (commentId: string) => {
    if (!replyContent.trim()) return;

    try {
      await addReply(commentId, replyContent);
      setReplyToComment(null);
      setReplyContent('');
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      try {
        await deleteComment(commentId);
      } catch (error) {
        // Error is handled in the hook
      }
    }
  };

  const handleToggleResolved = async (comment: Comment) => {
    try {
      await toggleResolved(comment.id, !comment.is_resolved);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Comments
          {selectedElementId && (
            <Badge variant="outline">Element Selected</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Comment */}
        <div className="space-y-2">
          <Textarea
            placeholder={selectedElementId
              ? "Add a comment to this element..."
              : "Add a general comment..."}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
          />
          <Button
            onClick={handleAddComment}
            disabled={!newComment.trim() || isLoading}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {isLoading ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>

        {/* Comments List */}
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {selectedElementId
                  ? "No comments on this element yet."
                  : "No comments yet. Start the conversation!"}
              </p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-3 border rounded-lg ${comment.is_resolved ? 'bg-green-50 border-green-200' : ''
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={comment.author?.avatar} />
                      <AvatarFallback>
                        {comment.author?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {comment.author?.name || 'Unknown User'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                        {comment.is_resolved && (
                          <Badge variant="secondary" className="text-xs">
                            Resolved
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm">{comment.content}</p>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReplyToComment(comment.id)}
                        >
                          <Reply className="h-3 w-3 mr-1" />
                          Reply
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleResolved(comment)}
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          {comment.is_resolved ? 'Reopen' : 'Resolve'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>

                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="ml-4 space-y-2 border-l-2 border-muted pl-4">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex items-start gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={reply.author.avatar} />
                                <AvatarFallback className="text-xs">
                                  {reply.author.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-xs">
                                    {reply.author.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(reply.timestamp, { addSuffix: true })}
                                  </span>
                                </div>
                                <p className="text-xs">{reply.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply Input */}
                      {replyToComment === comment.id && (
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Write a reply..."
                            className="min-h-[60px]"
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (replyContent.trim()) {
                                  handleReply(comment.id);
                                }
                              }
                            }}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleReply(comment.id)}
                              disabled={!replyContent.trim()}
                            >
                              Reply
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setReplyToComment(null);
                                setReplyContent('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
