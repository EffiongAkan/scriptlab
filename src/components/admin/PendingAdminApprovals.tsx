import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Shield, Check, X, Loader2, Clock, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export function PendingAdminApprovals() {
    const [pendingAdmins, setPendingAdmins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchPendingAdmins = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('admin_users')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPendingAdmins(data || []);
        } catch (error: any) {
            console.error('Error fetching pending admins:', error);
            toast({
                title: "Error",
                description: "Failed to load pending admin requests",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingAdmins();
    }, []);

    const handleApproval = async (id: string, action: 'approved' | 'rejected') => {
        try {
            setActionLoading(id);
            const { error } = await supabase
                .from('admin_users')
                .update({
                    status: action,
                    is_active: action === 'approved'
                })
                .eq('id', id);

            if (error) throw error;

            toast({
                title: action === 'approved' ? "Request Approved" : "Request Rejected",
                description: `Admin access has been ${action}.`,
            });

            fetchPendingAdmins();
        } catch (error: any) {
            console.error(`Error processing ${action}:`, error);
            toast({
                title: "Error",
                description: `Failed to ${action} request`,
                variant: "destructive"
            });
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                            <UserCheck className="h-5 w-5" />
                            Pending Admin Signups
                        </CardTitle>
                        <CardDescription>
                            Review and approve or reject new administrative account requests.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : pendingAdmins.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <p className="text-muted-foreground">No pending admin requests</p>
                    </div>
                ) : (
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Requested On</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingAdmins.map((admin) => (
                                    <TableRow key={admin.id}>
                                        <TableCell className="font-medium">{admin.email}</TableCell>
                                        <TableCell>
                                            {format(new Date(admin.created_at), 'MMM dd, yyyy HH:mm')}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                                Pending
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-200"
                                                    onClick={() => handleApproval(admin.id, 'approved')}
                                                    disabled={actionLoading === admin.id}
                                                >
                                                    {actionLoading === admin.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Check className="h-4 w-4 mr-1" />
                                                    )}
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border-red-200"
                                                    onClick={() => handleApproval(admin.id, 'rejected')}
                                                    disabled={actionLoading === admin.id}
                                                >
                                                    {actionLoading === admin.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <X className="h-4 w-4 mr-1" />
                                                    )}
                                                    Reject
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
