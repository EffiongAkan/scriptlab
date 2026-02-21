import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Key, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdminPasscodeClaimProps {
    onSuccess: () => void;
}

export function AdminPasscodeClaim({ onSuccess }: AdminPasscodeClaimProps) {
    const [passcode, setPasscode] = useState('');
    const [isClaiming, setIsClaiming] = useState(false);
    const { toast } = useToast();

    const handleClaim = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!passcode.trim()) return;

        try {
            setIsClaiming(true);
            const { data, error } = await supabase.rpc('claim_admin_invitation', {
                passcode: passcode.trim().toUpperCase()
            });

            if (error) throw error;

            if (data) {
                toast({
                    title: "Access Granted",
                    description: "You have successfully claimed admin access.",
                });
                onSuccess();
            }
        } catch (error: any) {
            console.error('Error claiming admin access:', error);
            toast({
                title: "Access Denied",
                description: error.message || "Invalid or expired passcode",
                variant: "destructive"
            });
        } finally {
            setIsClaiming(false);
        }
    };

    return (
        <Card className="w-full max-w-md border-primary/20 bg-primary/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Key className="h-5 w-5 text-primary" />
                    Claim Admin Access
                </CardTitle>
                <CardDescription>
                    Enter the invitation passcode provided by a Super Admin to grant your account administrative privileges.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleClaim} className="space-y-4">
                    <div className="space-y-2">
                        <Input
                            placeholder="e.g. ABCD-1234"
                            value={passcode}
                            onChange={(e) => setPasscode(e.target.value)}
                            className="text-center font-mono text-lg uppercase tracking-widest"
                            disabled={isClaiming}
                        />
                    </div>
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isClaiming || !passcode.trim()}
                    >
                        {isClaiming ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Verifying Passcode...
                            </>
                        ) : (
                            <>
                                <Shield className="h-4 w-4 mr-2" />
                                Claim Admin Role
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
