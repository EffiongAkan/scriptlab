import { useState, useEffect, useCallback, useRef } from "react";

interface SelectionState {
    text: string;
    top: number;
    left: number;
    elementId?: string;
    range?: Range;
}

/**
 * Detects text selection on both mouse (desktop) and touch (mobile) devices.
 *
 * Mobile strategy:
 *  - `touchend`: check if the native selection API has something selected.
 *    On iOS/Android, the user can double-tap a word or drag handles to select,
 *    and this fires when they lift their finger.
 *  - We then use the same getBoundingClientRect logic to position the menu,
 *    but clamp it within the viewport so it never goes off-screen.
 */
export function useQuoteSelection() {
    const [selection, setSelection] = useState<SelectionState | null>(null);
    const selectionClearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const resolveSelection = useCallback(() => {
        const selectionObj = window.getSelection();
        if (!selectionObj || selectionObj.isCollapsed) {
            setSelection(null);
            return;
        }

        const text = selectionObj.toString().trim();
        if (!text || text.length < 2) {
            setSelection(null);
            return;
        }

        const range = selectionObj.getRangeAt(0);
        let container = range.commonAncestorContainer as HTMLElement;
        if (container.nodeType === 3) container = container.parentElement as HTMLElement;

        // Find the closest element ID
        const elementNode =
            container.closest('[data-element-id]') ||
            container.closest('[id^="script-element-"]');
        let elementId = elementNode?.getAttribute('data-element-id');

        if (!elementId && elementNode?.id) {
            elementId = elementNode.id.replace('script-element-', '');
        }

        const rect = range.getBoundingClientRect();
        const menuWidth = 340; // approx width of the two-button menu
        const menuHeight = 44;

        // Raw position: centred above the selection
        let top = rect.top - menuHeight - 6;
        let left = rect.left + rect.width / 2 - menuWidth / 2;

        // Clamp to viewport so it never goes off-screen
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        left = Math.max(8, Math.min(left, vw - menuWidth - 8));
        if (top < 8) {
            // If there's no room above, show below the selection
            top = rect.bottom + 6;
        }
        top = Math.min(top, vh - menuHeight - 8);

        setSelection({
            text,
            top,
            left,
            elementId: elementId || undefined,
            range: range.cloneRange(),
        });
    }, []);

    useEffect(() => {
        // Desktop: mouseup
        const handleMouseUp = () => {
            // Small delay to let the browser finish updating the selection
            setTimeout(resolveSelection, 10);
        };

        // Mobile: touchend — fired when the finger lifts
        const handleTouchEnd = () => {
            // Needs a slightly longer delay on mobile since the browser
            // updates the selection object asynchronously after touchend
            setTimeout(resolveSelection, 100);
        };

        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('touchend', handleTouchEnd);

        return () => {
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [resolveSelection]);

    const clearSelection = useCallback(() => {
        setSelection(null);
        window.getSelection()?.removeAllRanges();
    }, []);

    return { selection, clearSelection };
}
