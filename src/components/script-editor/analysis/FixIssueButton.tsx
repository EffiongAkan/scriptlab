import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FixIssueButtonProps {
  issueDescription: string;
  fixSolution: string;
  onApply: () => void;
  isApplied?: boolean;
}

export const FixIssueButton: React.FC<FixIssueButtonProps> = ({
  issueDescription,
  fixSolution,
  onApply,
  isApplied = false
}) => {
  const { toast } = useToast();

  const handleClick = () => {
    onApply();
    toast({
      title: "Fix Applied",
      description: `Applied fix for: ${issueDescription}`,
      duration: 3000,
    });
  };

  if (isApplied) {
    return (
      <Button
        size="sm"
        variant="ghost"
        disabled
        className="text-green-400"
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        Applied
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleClick}
      className="hover:bg-primary/10"
    >
      <Wand2 className="h-4 w-4 mr-2" />
      Apply Fix
    </Button>
  );
};