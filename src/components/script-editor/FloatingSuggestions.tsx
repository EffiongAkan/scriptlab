import React from 'react';
import { Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Suggestion {
    id: string;
    text: string;
    type: 'creative' | 'technical';
}

interface FloatingSuggestionsProps {
    suggestions: Suggestion[];
    className?: string;
}

export const FloatingSuggestions = ({ suggestions, className }: FloatingSuggestionsProps) => {
    if (suggestions.length === 0) return null;

    return (
        <div className={cn("fixed bottom-10 left-1/2 -translate-x-1/2 z-40 flex flex-col gap-2 max-w-md w-full", className)}>
            {suggestions.map((suggestion) => (
                <div
                    key={suggestion.id}
                    className="bg-[#2D2D2D] text-gray-300 p-3 rounded-lg shadow-2xl border border-gray-700 flex items-start gap-3 animate-in slide-in-from-bottom-4"
                >
                    <div className="bg-yellow-500/20 p-1.5 rounded-md">
                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                    </div>
                    <p className="text-xs leading-relaxed">
                        {suggestion.text}
                    </p>
                </div>
            ))}
        </div>
    );
};
