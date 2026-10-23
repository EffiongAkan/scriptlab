import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Key, Copy, Check, Eye, EyeOff, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

interface AdminResetPasswordDialogProps {
  user: {
    id: string;
    email: string;
    profile?: {
      full_name?: string;
    };
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AdminResetPasswordDialog: React.FC<AdminResetPasswordDialogProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [result, setResult] = useState<{
    temporaryPassword: string;
    recoveryLink?: string | null;
    userEmail: string;
  } | null>(null);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let rand = '';
    for (let i = 0; i < 8; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const generated = `Temp#${rand}!`;
    setPassword(generated);
    return generated;
  };

  useEffect(() => {
    if (isOpen) {
      generateRandomPassword();
      setShowPassword(true);
      setResult(null);
      setCopiedPassword(false);
      setCopiedLink(false);
    }
  }, [isOpen]);

  const handleCopyPassword = () => {
    const textToCopy = result?.temporaryPassword || password;
    navigator.clipboard.writeText(textToCopy);
    setCopiedPassword(true);
    toast({
      title: 'Password Copied',
      description: 'Temporary password copied to clipboard.',
    });
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const handleCopyLink = () => {
    if (result?.recoveryLink) {
      navigator.clipboard.writeText(result.recoveryLink);
      setCopiedLink(true);
      toast({
        title: 'Link Copied',
        description: 'Password recovery link copied to clipboard.',
      });
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleResetPassword = async () => {
    if (!user) return;

    if (!password || password.trim().length < 8) {
      toast({
        title: 'Invalid Password',
        description: 'Password must be at least 8 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await supabase.functions.invoke('admin-operations', {
        body: {
          operation: 'reset_user_password',
          data: {
            userId: user.id,
            newPassword: password.trim(),
            sendEmail,
          },
        },
      });

      if (response.error) {
        throw response.error;
      }

      const data = response.data;
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to reset password');
      }

      setResult({
        temporaryPassword: data.temporaryPassword || password.trim(),
        recoveryLink: data.recoveryLink,
        userEmail: data.userEmail || user.email,
      });

      toast({
        title: 'Password Reset Successful',
        description: `New password created for ${user.email}.`,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Failed to reset user password:', error);
      toast({
        title: 'Reset Failed',
        description: error?.message || 'Unable to reset user password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setPassword('');
    onClose();
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? handleClose() : null)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-amber-500/10 text-amber-500">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">Reset User Password</DialogTitle>
              <DialogDescription className="text-xs">
                Manage credentials for {user.profile?.full_name ? `${user.profile.full_name} (${user.email})` : user.email}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {result ? (
          <div className="space-y-4 py-3">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-emerald-400">Password Reset Completed</p>
                <p className="text-xs text-muted-foreground">
                  The user's password has been updated. They can now log in immediately with this temporary password.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                Temporary Password
              </Label>
              <div className="flex items-center gap-2 bg-muted p-2.5 rounded-lg border font-mono text-sm">
                <span className="flex-1 select-all font-bold tracking-wide">{result.temporaryPassword}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyPassword}
                  className="h-8 gap-1 text-xs"
                >
                  {copiedPassword ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            {result.recoveryLink && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
                  Direct Recovery Link
                </Label>
                <div className="flex items-center gap-2 bg-muted p-2.5 rounded-lg border text-xs">
                  <span className="flex-1 truncate font-mono text-muted-foreground">{result.recoveryLink}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyLink}
                    className="h-8 gap-1 text-xs shrink-0"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Link
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-400">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Setting a new temporary password will overwrite the user's current password. Be sure to copy and communicate it to the user.
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="temp-password" className="text-sm font-medium">
                  Temporary Password
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={generateRandomPassword}
                  className="h-7 text-xs text-primary gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Generate New
                </Button>
              </div>

              <div className="relative">
                <Input
                  id="temp-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter or generate temporary password"
                  className="pr-20 font-mono text-sm"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground p-1"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="text-muted-foreground hover:text-foreground p-1"
                    title="Copy to clipboard"
                  >
                    {copiedPassword ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">Minimum 8 characters. Includes letters, numbers, and symbols.</p>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <Checkbox
                id="send-email"
                checked={sendEmail}
                onCheckedChange={(checked) => setSendEmail(!!checked)}
              />
              <Label
                htmlFor="send-email"
                className="text-xs font-normal cursor-pointer leading-tight text-muted-foreground"
              >
                Also generate a recovery link for {user.email}
              </Label>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleResetPassword}
                disabled={loading || !password || password.trim().length < 8}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {loading ? 'Resetting...' : 'Set Temporary Password'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
