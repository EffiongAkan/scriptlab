
import React from 'react';
import { useScriptContent, ScriptElementType } from '@/hooks/useScriptContent';
import { useScriptHistory } from '@/contexts/ScriptHistoryContext';
import { ElementTypeChanger } from './ElementTypeChanger';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

interface ElementTypeChangerExampleProps {
    scriptId: string;
}

/**
 * Example component demonstrating how to use the ElementTypeChanger
 * This can be used as a reference or directly integrated into your script editor
 */
export const ElementTypeChangerExample: React.FC<ElementTypeChangerExampleProps> = ({ scriptId }) => {
    const { elements, changeElementType } = useScriptContent(scriptId);
    const { pushState } = useScriptHistory();
    const { toast } = useToast();

    const handleTypeChange = async (elementId: string, newType: ScriptElementType['type']) => {
        try {
            // Find the element to get its current type
            const element = elements.find(el => el.id === elementId);
            if (!element) {
                toast({
                    title: 'Error',
                    description: 'Element not found',
                    variant: 'destructive',
                });
                return;
            }

            const oldType = element.type;

            // Change the type
            await changeElementType(elementId, newType);

            // Update history for undo/redo support
            pushState(elements);

            // Show success toast
            toast({
                title: 'Element Type Changed',
                description: `Changed from ${oldType} to ${newType}`,
            });

            console.log(`Successfully changed element ${elementId} from ${oldType} to ${newType}`);
        } catch (error) {
            // Show error toast
            toast({
                title: 'Error',
                description: 'Failed to change element type',
                variant: 'destructive',
            });
            console.error('Error changing element type:', error);
        }
    };

    return (
        <div className="space-y-4 p-4">
            <h2 className="text-2xl font-bold mb-4">Script Elements</h2>
            {elements.length === 0 ? (
                <p className="text-muted-foreground">No elements to display</p>
            ) : (
                elements.map(element => (
                    <Card key={element.id}>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-muted-foreground mb-1">
                                        {element.type.toUpperCase()}
                                    </p>
                                    <p className="text-base break-words">{element.content}</p>
                                </div>
                                <div className="flex-shrink-0">
                                    <ElementTypeChanger
                                        currentType={element.type}
                                        onTypeChange={(newType) => handleTypeChange(element.id, newType)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    );
};
