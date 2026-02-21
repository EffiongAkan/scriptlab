
import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardFooter } from '@/components/ui/card';

interface Comment {
  id: string;
  comment: string;
  user: string;
  elementId: string;
  timestamp: string;
  isOwn?: boolean;
}

interface CommentSectionProps {
  comments: Comment[];
  newComment: string;
  onCommentChange: (value: string) => void;
  onAddComment: () => void;
}

const CommentItem = ({ comment, user, timestamp, isOwn }: Comment) => {
  return (
    <div className={`flex flex-col mb-2 p-2 rounded ${isOwn ? 'bg-blue-50' : 'bg-gray-50'}`}>
      <div className="flex justify-between items-center">
        <span className="font-medium text-xs">{user}</span>
        <span className="text-xs text-gray-500">{new Date(timestamp).toLocaleTimeString()}</span>
      </div>
      <p className="text-sm mt-1">{comment}</p>
    </div>
  );
};

export const CommentSection = ({ 
  comments, 
  newComment, 
  onCommentChange, 
  onAddComment 
}: CommentSectionProps) => {
  return (
    <>
      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem key={comment.id} {...comment} />
          ))
        ) : (
          <div className="text-center p-4 text-muted-foreground text-sm">
            No comments yet. Be the first to add a comment!
          </div>
        )}
      </div>
      <CardFooter className="flex flex-col gap-2 pt-4 px-0">
        <div className="relative w-full">
          <Input
            placeholder="Add a comment or suggestion..."
            value={newComment}
            onChange={(e) => onCommentChange(e.target.value)}
          />
          <Button 
            size="sm" 
            className="absolute right-1 top-1/2 transform -translate-y-1/2"
            onClick={onAddComment}
            disabled={!newComment}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Comments and suggestions are visible to all collaborators.
        </p>
      </CardFooter>
    </>
  );
};
