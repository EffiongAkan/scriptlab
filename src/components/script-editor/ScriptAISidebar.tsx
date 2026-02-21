import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, MessageSquare, BarChart3, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScriptAISidebarProps {
    className?: string;
    isTyping?: string[];
}

export const ScriptAISidebar = ({ className, isTyping = [] }: ScriptAISidebarProps) => {
    return (
        <aside className={cn("w-[320px] bg-[var(--editor-right-bg)] text-white flex flex-col p-4 gap-6", className)}>
            <div className="space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    AI Assistant
                </h2>

                <div className="space-y-3">
                    <div className="bg-teal-900/20 border border-teal-500/30 rounded-xl p-4 space-y-3">
                        <Button
                            className="w-full bg-[#00BFA5] hover:bg-[#00A892] text-white rounded-lg justify-start gap-2 h-10 text-sm font-medium"
                        >
                            <Sparkles className="w-4 h-4" />
                            Generate with AI
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full border-teal-500/30 bg-transparent hover:bg-teal-500/10 text-teal-400 rounded-lg justify-start gap-2 h-10 text-sm font-medium"
                        >
                            <MessageSquare className="w-4 h-4" />
                            Suggest next line
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full border-teal-500/30 bg-transparent hover:bg-teal-500/10 text-teal-400 rounded-lg justify-start gap-2 h-10 text-sm font-medium"
                        >
                            <BarChart3 className="w-4 h-4" />
                            Analyze script
                        </Button>
                    </div>
                </div>
            </div>

            <div className="space-y-4 mt-auto pb-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    Real-time collaboration
                </h2>

                <div className="space-y-2">
                    {isTyping.length > 0 ? (
                        isTyping.map(user => (
                            <div key={user} className="flex items-center gap-2 text-xs text-teal-400/80 italic">
                                <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                                {user} is typing...
                            </div>
                        ))
                    ) : (
                        <div className="text-xs text-gray-600 italic">No activity currently</div>
                    )}
                </div>
            </div>
        </aside>
    );
};
