import React from 'react';
import { useAICredits } from '@/hooks/useAICredits';
import { useNavigate } from 'react-router-dom';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Zap } from 'lucide-react';

interface CreditDeductionGuardProps {
    requiredCredits: number;
    onConfirm: () => void;
    children: React.ReactElement;
    actionLabel?: string;
}

/**
 * Wraps an action that costs AI credits. If the user doesn't have enough,
 * shows a dialog pointing them to the Premium page.
 */
export function CreditDeductionGuard({
    requiredCredits,
    onConfirm,
    children,
    actionLabel = 'this action',
}: CreditDeductionGuardProps) {
    const { data: credits } = useAICredits();
    const navigate = useNavigate();
    const [open, setOpen] = React.useState(false);

    const hasEnough = (credits ?? 0) >= requiredCredits;

    const handleClick = () => {
        if (hasEnough) {
            onConfirm();
        } else {
            setOpen(true);
        }
    };

    return (
        <>
            {React.cloneElement(children, { onClick: handleClick })}
            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            Insufficient AI Credits
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {actionLabel} requires <strong>{requiredCredits} AI credits</strong>, but you only
                            have <strong>{credits ?? 0}</strong>. Purchase more credits to continue.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => navigate('/premium?tab=credits')}>
                            Get More Credits
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
