
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminPasscodeClaim } from './AdminPasscodeClaim';

interface AdminAccessGateProps {
  children: React.ReactNode;
}

export function AdminAccessGate({ children }: AdminAccessGateProps) {
  const { isAdmin, loading, error, createFirstAdmin } = useAdminAccess();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-primary animate-pulse" />
            </div>
            <CardTitle className="text-center">Checking Admin Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
            <Skeleton className="h-8 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-center">Access Error</CardTitle>
            <CardDescription className="text-center">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 space-y-6">
        <div className="flex flex-col items-center text-center space-y-2 mb-4">
          <Shield className="h-16 w-16 text-primary" />
          <h1 className="text-3xl font-bold">Admin Portal</h1>
          <p className="text-muted-foreground max-w-sm">
            Access to this area is restricted to authorized personnel only.
          </p>
        </div>

        <AdminPasscodeClaim onSuccess={() => window.location.reload()} />

        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">No admin account?</CardTitle>
              <CardDescription>
                If you are setting up the system for the first time, you can initialize the first admin account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={createFirstAdmin}
                className="w-full"
              >
                <Shield className="h-4 w-4 mr-2" />
                Initialize First Admin Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
