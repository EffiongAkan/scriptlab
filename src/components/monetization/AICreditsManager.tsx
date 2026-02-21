
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Zap, Plus, Sparkles, Clock, TrendingUp, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAICredits, useCreditHistory, addAICredits } from '@/hooks/useAICredits';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  bonus?: number;
  popular?: boolean;
}

const creditPackages: CreditPackage[] = [
  { id: 'small', name: 'Starter Pack', credits: 50 },
  { id: 'medium', name: 'Creator Pack', credits: 150, bonus: 25, popular: true },
  { id: 'large', name: 'Professional Pack', credits: 300, bonus: 75 },
  { id: 'xl', name: 'Studio Pack', credits: 600, bonus: 200 },
];

export const AICreditsManager: React.FC = () => {
  const [customAmount, setCustomAmount] = useState('');
  const [requestPkg, setRequestPkg] = useState<CreditPackage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { data: currentCredits, refetch } = useAICredits();
  const { data: history = [], refetch: refetchHistory } = useCreditHistory();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // For demo: directly add credits on top-up request confirmation
  const handleConfirmPurchase = async (pkg: CreditPackage) => {
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const totalCredits = pkg.credits + (pkg.bonus ?? 0);
      const success = await addAICredits(user.id, totalCredits, 'purchase', `${pkg.name} - ${totalCredits} credits`);

      if (success) {
        toast({ title: '✅ Credits Added!', description: `${totalCredits} AI credits added to your account.` });
        queryClient.invalidateQueries({ queryKey: ['ai_credits'] });
        queryClient.invalidateQueries({ queryKey: ['credit_history'] });
        setRequestPkg(null);
      } else {
        toast({ title: 'Error', description: 'Failed to add credits.', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomPurchase = async () => {
    const amount = parseInt(customAmount, 10);
    if (!amount || amount < 10) {
      toast({ title: 'Invalid Amount', description: 'Minimum 10 credits.', variant: 'destructive' });
      return;
    }
    const pkg: CreditPackage = { id: 'custom', name: 'Custom Pack', credits: amount };
    setRequestPkg(pkg);
  };

  const totalUsedThisMonth = history
    .filter((t) => {
      const d = new Date(t.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.amount < 0;
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="w-full space-y-4 md:space-y-6">
      {/* Credits Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-sm font-medium">Available Credits</CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{currentCredits ?? 0}</div>
            <p className="text-xs text-muted-foreground">Ready to use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-sm font-medium">Used This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{totalUsedThisMonth}</div>
            <p className="text-xs text-muted-foreground">Credits consumed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Sparkles className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{history.length}</div>
            <p className="text-xs text-muted-foreground">Total recorded</p>
          </CardContent>
        </Card>
      </div>

      {/* Credit Packages */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Purchase AI Credits
          </CardTitle>
          <p className="text-sm text-muted-foreground">Credits never expire.</p>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {creditPackages.map((pkg) => (
              <Card key={pkg.id} className={`relative ${pkg.popular ? 'border-primary shadow-md' : ''}`}>
                {pkg.popular && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground text-xs">Best Value</Badge>
                  </div>
                )}
                <CardHeader className="text-center p-4">
                  <CardTitle className="text-base">{pkg.name}</CardTitle>
                  <div className="text-2xl font-bold text-primary">
                    {pkg.credits}
                    {pkg.bonus && <span className="text-sm text-green-600"> +{pkg.bonus}</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">credits</div>
                </CardHeader>
                <CardContent className="pt-0 p-4">
                  <Button
                    className="w-full"
                    variant={pkg.popular ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRequestPkg(pkg)}
                  >
                    Select
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Custom Amount */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="number"
              placeholder="Custom amount (min. 10)"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              min="10"
              className="flex-1"
            />
            <Button onClick={handleCustomPurchase} disabled={!customAmount}>
              Custom Purchase
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Real Usage History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No transactions yet. Start using AI features to see your history.</p>
          ) : (
            <div className="space-y-2">
              {history.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    {tx.amount < 0 ? (
                      <ArrowDownCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                    ) : (
                      <ArrowUpCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    )}
                    <div>
                      <div className="text-sm font-medium capitalize">{tx.description || tx.action}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${tx.amount < 0 ? 'text-red-400' : 'text-green-500'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purchase Confirmation Dialog */}
      <Dialog open={!!requestPkg} onOpenChange={() => setRequestPkg(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Credit Purchase</DialogTitle>
            <DialogDescription>
              You are requesting <strong>{requestPkg ? requestPkg.credits + (requestPkg.bonus ?? 0) : 0} AI credits</strong>.
              {' '}For demo purposes, credits will be added instantly.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestPkg(null)}>Cancel</Button>
            <Button
              onClick={() => requestPkg && handleConfirmPurchase(requestPkg)}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Confirm & Add Credits'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
