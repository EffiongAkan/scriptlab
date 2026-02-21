import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Shield, Plus, Copy, Check, Clock, User, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export function AdminInvitationManager() {
    const [invites, setInvites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchInvites = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('admin_invitations' as any)
                .select(`
          *,
          role:admin_roles!admin_invitations_role_fkey(name),
          creator:profiles!admin_invitations_created_by_fkey(full_name, email),
          user:profiles!admin_invitations_used_by_fkey(full_name, email)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setInvites(data || []);
        } catch (error: any) {
            console.error('Error fetching invites:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to load admin invitations",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvites();
    }, []);

    const handleGenerateCode = async () => {
        try {
            setIsGenerating(true);
            const { data, error } = await (supabase.rpc as any)('create_admin_invitation', {
                role_name: 'Super Admin',
                expires_in_hours: 24
            });

            if (error) throw error;

            toast({
                title: "Success",
                description: `New passcode generated: ${data}`,
            });
            fetchInvites();
        } catch (error: any) {
            console.error('Error generating passcode:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to generate passcode",
                variant: "destructive"
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
        toast({
            title: "Copied",
            description: "Code copied to clipboard",
        });
    };

    const handleDeleteInvite = async (id: string) => {
        try {
            const { error } = await supabase
                .from('admin_invitations' as any)
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast({
                title: "Deleted",
                description: "Invitation removed successfully",
            });
            fetchInvites();
        } catch (error: any) {
            console.error('Error deleting invitation:', error);
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Admin Invitation Passcodes
                        </CardTitle>
                        <CardDescription>
                            Generate single-use passcodes to grant administrative access to other users.
                        </CardDescription>
                    </div>
                    <Button onClick={handleGenerateCode} disabled={isGenerating}>
                        {isGenerating ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Plus className="h-4 w-4 mr-2" />
                        )}
                        Generate Super Admin Code
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : invites.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <p className="text-muted-foreground">No active invitations found</p>
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Passcode</TableHead>
                                    <TableHead>Expires</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Created By</TableHead>
                                    <TableHead>Used By</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invites.map((invite) => {
                                    const isExpired = new Date(invite.expires_at) < new Date();
                                    const isUsed = invite.is_used;

                                    return (
                                        <TableRow key={invite.id}>
                                            <TableCell className="font-mono font-bold">
                                                <div className="flex items-center gap-2">
                                                    {invite.code}
                                                    {!isUsed && !isExpired && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => copyToClipboard(invite.code)}
                                                        >
                                                            {copiedCode === invite.code ? (
                                                                <Check className="h-4 w-4 text-green-500" />
                                                            ) : (
                                                                <Copy className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    {format(new Date(invite.expires_at), 'MMM d, HH:mm')}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {isUsed ? (
                                                    <Badge variant="secondary" className="bg-green-100 text-green-700">Used</Badge>
                                                ) : isExpired ? (
                                                    <Badge variant="secondary" className="bg-red-100 text-red-700">Expired</Badge>
                                                ) : (
                                                    <Badge className="bg-blue-100 text-blue-700">Active</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                <div className="flex flex-col">
                                                    <span>{invite.creator?.full_name || 'System'}</span>
                                                    <span className="text-xs text-muted-foreground">{invite.creator?.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {isUsed ? (
                                                    <div className="flex flex-col">
                                                        <span>{invite.user?.full_name}</span>
                                                        <span className="text-xs text-muted-foreground">{invite.user?.email}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleDeleteInvite(invite.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
