import React, { useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Replace, ChevronDown, ChevronUp, X } from 'lucide-react';

interface FindReplaceDialogProps {
    open: boolean;
    onClose: () => void;
    searchTerm: string;
    replaceTerm: string;
    caseSensitive: boolean;
    wholeWord: boolean;
    currentMatchIndex: number;
    totalMatches: number;
    onSearchChange: (value: string) => void;
    onReplaceChange: (value: string) => void;
    onCaseSensitiveChange: (checked: boolean) => void;
    onWholeWordChange: (checked: boolean) => void;
    onFindNext: () => void;
    onFindPrevious: () => void;
    onReplace: () => void;
    onReplaceAll: () => void;
    showReplace?: boolean;
}

export const FindReplaceDialog: React.FC<FindReplaceDialogProps> = ({
    open,
    onClose,
    searchTerm,
    replaceTerm,
    caseSensitive,
    wholeWord,
    currentMatchIndex,
    totalMatches,
    onSearchChange,
    onReplaceChange,
    onCaseSensitiveChange,
    onWholeWordChange,
    onFindNext,
    onFindPrevious,
    onReplace,
    onReplaceAll,
    showReplace = true,
}) => {
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Auto-focus search input when dialog opens
    useEffect(() => {
        if (open) {
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
    }, [open]);

    // Handle Enter key in search input
    const handleSearchKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (e.shiftKey) {
                onFindPrevious();
            } else {
                onFindNext();
            }
        }
    };

    // Handle Enter key in replace input
    const handleReplaceKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            onReplace();
        }
    };

    const matchesDisplay = totalMatches > 0
        ? `${currentMatchIndex + 1} of ${totalMatches}`
        : totalMatches === 0 && searchTerm
            ? 'No matches'
            : '';

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            {showReplace ? <Replace className="h-5 w-5" /> : <Search className="h-5 w-5" />}
                            {showReplace ? 'Find and Replace' : 'Find'}
                        </span>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Search Input */}
                    <div className="space-y-2">
                        <Label htmlFor="search">Find</Label>
                        <div className="flex gap-2">
                            <Input
                                ref={searchInputRef}
                                id="search"
                                placeholder="Search text..."
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                className="flex-1"
                            />
                            <div className="flex gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={onFindPrevious}
                                    disabled={totalMatches === 0}
                                    title="Previous match (Shift+Enter)"
                                >
                                    <ChevronUp className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={onFindNext}
                                    disabled={totalMatches === 0}
                                    title="Next match (Enter)"
                                >
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        {matchesDisplay && (
                            <p className="text-sm text-muted-foreground">{matchesDisplay}</p>
                        )}
                    </div>

                    {/* Replace Input */}
                    {showReplace && (
                        <div className="space-y-2">
                            <Label htmlFor="replace">Replace with</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="replace"
                                    placeholder="Replacement text..."
                                    value={replaceTerm}
                                    onChange={(e) => onReplaceChange(e.target.value)}
                                    onKeyDown={handleReplaceKeyDown}
                                    className="flex-1"
                                />
                            </div>
                        </div>
                    )}

                    {/* Options */}
                    <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="case-sensitive"
                                checked={caseSensitive}
                                onCheckedChange={onCaseSensitiveChange}
                            />
                            <Label
                                htmlFor="case-sensitive"
                                className="text-sm font-normal cursor-pointer"
                            >
                                Match case
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="whole-word"
                                checked={wholeWord}
                                onCheckedChange={onWholeWordChange}
                            />
                            <Label
                                htmlFor="whole-word"
                                className="text-sm font-normal cursor-pointer"
                            >
                                Match whole word
                            </Label>
                        </div>
                    </div>

                    {/* Actions */}
                    {showReplace && (
                        <div className="flex gap-2 pt-2">
                            <Button
                                variant="outline"
                                onClick={onReplace}
                                disabled={currentMatchIndex < 0 || totalMatches === 0}
                                className="flex-1"
                            >
                                Replace
                            </Button>
                            <Button
                                variant="default"
                                onClick={onReplaceAll}
                                disabled={totalMatches === 0}
                                className="flex-1"
                            >
                                Replace All ({totalMatches})
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
