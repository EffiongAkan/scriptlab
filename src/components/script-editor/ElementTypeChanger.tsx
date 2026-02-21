
import React from 'react';
import { ScriptElementType } from '@/hooks/useScriptContent';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, FileText, Film, User, MessageSquare, Type, ArrowRight } from 'lucide-react';

interface ElementTypeChangerProps {
    currentType: ScriptElementType['type'];
    onTypeChange: (newType: ScriptElementType['type']) => void;
    className?: string;
}

/**
 * Component to display a dropdown menu for changing script element types
 */
export const ElementTypeChanger: React.FC<ElementTypeChangerProps> = ({
    currentType,
    onTypeChange,
    className
}) => {
    const typeConfig: Record<ScriptElementType['type'], { label: string; icon: React.ReactNode; description: string }> = {
        heading: {
            label: 'Scene Heading',
            icon: <Film className="w-4 h-4" />,
            description: 'INT./EXT. LOCATION - TIME'
        },
        action: {
            label: 'Action',
            icon: <FileText className="w-4 h-4" />,
            description: 'Scene description or action'
        },
        character: {
            label: 'Character',
            icon: <User className="w-4 h-4" />,
            description: 'CHARACTER NAME'
        },
        dialogue: {
            label: 'Dialogue',
            icon: <MessageSquare className="w-4 h-4" />,
            description: 'Character dialogue'
        },
        parenthetical: {
            label: 'Parenthetical',
            icon: <Type className="w-4 h-4" />,
            description: '(action or emotion)'
        },
        transition: {
            label: 'Transition',
            icon: <ArrowRight className="w-4 h-4" />,
            description: 'CUT TO: / FADE OUT:'
        }
    };

    const currentConfig = typeConfig[currentType];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={className}
                >
                    <span className="flex items-center gap-2">
                        {currentConfig.icon}
                        <span>{currentConfig.label}</span>
                        <ChevronDown className="w-3 h-3" />
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Change Element Type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.entries(typeConfig).map(([type, config]) => (
                    <DropdownMenuItem
                        key={type}
                        onClick={() => onTypeChange(type as ScriptElementType['type'])}
                        disabled={type === currentType}
                        className="cursor-pointer"
                    >
                        <div className="flex items-center gap-2 w-full">
                            {config.icon}
                            <div className="flex flex-col flex-1">
                                <span className="font-medium">{config.label}</span>
                                <span className="text-xs text-muted-foreground">{config.description}</span>
                            </div>
                            {type === currentType && (
                                <span className="text-xs text-muted-foreground">Current</span>
                            )}
                        </div>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
