
import React, { useState } from 'react';
import { UserPlus, Mail, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InviteCollaboratorDialogProps {
  newEmail: string;
  setNewEmail: (email: string) => void;
  onInvite: (role?: string) => void;
}

export const InviteCollaboratorDialog = ({
  newEmail,
  setNewEmail,
  onInvite
}: InviteCollaboratorDialogProps) => {
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState('editor');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    onInvite(permission);
    setOpen(false);
    setMessage('');
    setPermission('editor');
  };

  const handleQuickInvite = () => {
    if (newEmail.trim()) {
      onInvite('editor'); // Default to editor for quick invite
    }
  };

  return (
    <div className="flex gap-2">
      {/* Quick invite button */}
      <Button
        onClick={handleQuickInvite}
        className="flex-1"
        disabled={!newEmail.trim()}
      >
        <Send className="mr-2 h-4 w-4" />
        Send Invitation
      </Button>

      {/* Advanced invite dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <UserPlus className="mr-2 h-4 w-4" />
            Advanced
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Invite Collaborator
            </DialogTitle>
            <DialogDescription>
              Send a detailed invitation to collaborate on this script with custom permissions and message.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="permission">Permission Level</Label>
              <Select value={permission} onValueChange={setPermission}>
                <SelectTrigger>
                  <SelectValue placeholder="Select permission level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Viewer</span>
                      <span className="text-xs text-muted-foreground">Can view and comment</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="editor">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Editor</span>
                      <span className="text-xs text-muted-foreground">Can view, comment, and edit</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Admin</span>
                      <span className="text-xs text-muted-foreground">Full access including invitations</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Personal Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Add a personal note to your invitation..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!newEmail.trim()}>
              <Send className="mr-2 h-4 w-4" />
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
