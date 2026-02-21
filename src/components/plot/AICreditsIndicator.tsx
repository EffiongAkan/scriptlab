
import React, { useEffect, useState } from 'react';
import { Zap, AlertTriangle, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { checkUserCredits } from '@/services/plot-ai-service';

interface AICreditsIndicatorProps {
  onLowCredits?: () => void;
  className?: string;
}

export const AICreditsIndicator: React.FC<AICreditsIndicatorProps> = ({
  onLowCredits,
  className = ''
}) => {
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchCredits = async () => {
    setLoading(true);
    const { credits: userCredits, error: creditError } = await checkUserCredits();
    setCredits(userCredits);
    setError(creditError || '');
    setLoading(false);

    if (userCredits < 5 && onLowCredits) {
      onLowCredits();
    }
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
        <Zap className="h-4 w-4 animate-pulse" />
        <span>Loading credits...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center gap-2 text-sm text-red-600 ${className}`}>
        <AlertTriangle className="h-4 w-4" />
        <span>Unable to load credits</span>
      </div>
    );
  }

  if (credits === 0) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">No AI Credits</span>
            </div>
            <Button 
              size="sm"
              onClick={() => window.location.href = '/monetization'}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <CreditCard className="h-3 w-3 mr-1" />
              Get Credits
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (credits < 5) {
    return (
      <div className={`flex items-center gap-2 text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded ${className}`}>
        <AlertTriangle className="h-4 w-4" />
        <span className="font-medium">{credits} credits remaining</span>
        <Button 
          size="sm"
          variant="outline"
          onClick={() => window.location.href = '/monetization'}
          className="border-orange-300 text-orange-700 hover:bg-orange-100 h-6 px-2 text-xs"
        >
          Add More
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded ${className}`}>
      <Zap className="h-4 w-4" />
      <span className="font-medium">{credits} credits</span>
    </div>
  );
};
