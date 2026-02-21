
import { useCallback } from 'react';
import { ScriptElementType } from './useScriptContent';

/**
 * Hook to provide utilities for changing script element types
 * @param changeElementType - The changeElementType function from useScriptContent
 */
export const useElementTypeChanger = (
    changeElementType: (id: string, newType: ScriptElementType['type']) => Promise<void>
) => {
    /**
     * Change element to a heading
     */
    const changeToHeading = useCallback((id: string) => {
        return changeElementType(id, 'heading');
    }, [changeElementType]);

    /**
     * Change element to an action
     */
    const changeToAction = useCallback((id: string) => {
        return changeElementType(id, 'action');
    }, [changeElementType]);

    /**
     * Change element to a character name
     */
    const changeToCharacter = useCallback((id: string) => {
        return changeElementType(id, 'character');
    }, [changeElementType]);

    /**
     * Change element to dialogue
     */
    const changeToDialogue = useCallback((id: string) => {
        return changeElementType(id, 'dialogue');
    }, [changeElementType]);

    /**
     * Change element to parenthetical
     */
    const changeToParenthetical = useCallback((id: string) => {
        return changeElementType(id, 'parenthetical');
    }, [changeElementType]);

    /**
     * Change element to transition
     */
    const changeToTransition = useCallback((id: string) => {
        return changeElementType(id, 'transition');
    }, [changeElementType]);

    /**
     * Get a friendly name for element types
     */
    const getTypeName = useCallback((type: ScriptElementType['type']): string => {
        const typeNames: Record<ScriptElementType['type'], string> = {
            heading: 'Scene Heading',
            action: 'Action',
            character: 'Character',
            dialogue: 'Dialogue',
            parenthetical: 'Parenthetical',
            transition: 'Transition',
        };
        return typeNames[type];
    }, []);

    /**
     * Get all available element types
     */
    const getAvailableTypes = useCallback((): ScriptElementType['type'][] => {
        return ['heading', 'action', 'character', 'dialogue', 'parenthetical', 'transition'];
    }, []);

    return {
        changeToHeading,
        changeToAction,
        changeToCharacter,
        changeToDialogue,
        changeToParenthetical,
        changeToTransition,
        getTypeName,
        getAvailableTypes,
        changeElementType, // Also expose the raw function
    };
};
