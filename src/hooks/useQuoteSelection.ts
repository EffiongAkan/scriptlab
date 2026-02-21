import { useState, useEffect, useCallback } from "react";

interface SelectionState {
    text: string;
    top: number;
    left: number;
    elementId?: string;
    range?: Range;
}

export function useQuoteSelection() {
    const [selection, setSelection] = useState<SelectionState | null>(null);

    useEffect(() => {
        const handleSelection = () => {
            const selectionObj = window.getSelection();
            if (!selectionObj || selectionObj.isCollapsed) {
                setSelection(null);
                return;
            }

            const range = selectionObj.getRangeAt(0);
            const text = selectionObj.toString().trim();

            if (!text) return;

            // Find parent with data-script-element or data-element-id
            // In SharedReader we used data-element-id. In main editor we might use something else.
            // We'll look for a generic attribute or handle it in the component.

            let container = range.commonAncestorContainer as HTMLElement;
            if (container.nodeType === 3) container = container.parentElement as HTMLElement;

            // Try to find the closest element ID
            const elementNode = container.closest('[data-element-id]') || container.closest('[id^="script-element-"]');
            let elementId = elementNode?.getAttribute('data-element-id');

            // Fallback for main editor where ID might be "script-element-{uuid}"
            if (!elementId && elementNode?.id) {
                elementId = elementNode.id.replace('script-element-', '');
            }

            const rect = range.getBoundingClientRect();

            setSelection({
                text,
                top: rect.top - 40,
                left: rect.left + (rect.width / 2) - 20,
                elementId: elementId || undefined,
                range: range.cloneRange()
            });
        };

        document.addEventListener('mouseup', handleSelection);
        // document.addEventListener('keyup', handleSelection); // Also handle keyboard selection?

        return () => {
            document.removeEventListener('mouseup', handleSelection);
        };
    }, []);

    const clearSelection = useCallback(() => {
        setSelection(null);
        window.getSelection()?.removeAllRanges();
    }, []);

    return { selection, clearSelection };
}
