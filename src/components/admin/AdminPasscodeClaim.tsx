import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Key, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AdminPasscodeClaimProps {
    onSuccess: () => void;
    onSignInRequired?: () => void;
}

export function AdminPasscodeClaim({ onSuccess, onSignInRequired }: AdminPasscodeClaimProps) {
    const [passcode, setPasscode] = useState('');
    const [isClaiming, setIsClaiming] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setCheckingAuth(false);
        };
        checkUser();
    }, []);

    const handleClaim = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!passcode.trim() || !user) return;

        try {
            setIsClaiming(true);
            const { data, error } = await (supabase.rpc as any)('claim_admin_invitation', {
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

    if (checkingAuth) {
        return (
            <Card className="w-full max-w-md border-primary/20 bg-primary/5">
                <CardContent className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }

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
            <CardContent className="space-y-4">
                {!user && (
                    <Alert variant="destructive" className="bg-red-900/20 border-red-900/50">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Authentication Required</AlertTitle>
                        <AlertDescription>
                            Please **Sign In** or **Sign Up** first to claim admin access. Your account needs to be verified before privileges can be assigned.
                        </AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleClaim} className="space-y-4">
                    <div className="space-y-2">
                        <Input
                            placeholder="e.g. ABCD-1234"
                            value={passcode}
                            onChange={(e) => setPasscode(e.target.value)}
                            className="text-center font-mono text-lg uppercase tracking-widest bg-white/5 border-white/10"
                            disabled={isClaiming || !user}
                        />
                    </div>
                    {!user ? (
                        <Button
                            type="button"
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12"
                            onClick={() => {
                                sessionStorage.setItem("returnToClaim", "true");
                                if (onSignInRequired) onSignInRequired();
                            }}
                        >
                            Sign In to Claim Admin Role
                        </Button>
                    ) : (
                        <Button
                            type="submit"
                            className="w-full bg-naija-gold hover:bg-naija-gold/90 text-black font-bold h-12"
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
                    )}
                </form>
            </CardContent>
        </Card>
    );
}
