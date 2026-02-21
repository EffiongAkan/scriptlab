import { useState, useEffect, useCallback, useRef } from 'react';

interface SuggestionPosition {
  x: number;
  y: number;
}

export const useContextualSuggestions = () => {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState<SuggestionPosition>({ x: 0, y: 0 });
  const [currentText, setCurrentText] = useState('');
  const [context, setContext] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const lastCaretPosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Hide menu
  const hideMenu = useCallback(() => {
    setIsMenuVisible(false);
  }, []);

  // Show menu at cursor position
  const showMenu = useCallback((position: SuggestionPosition, text: string, contextText: string) => {
    setMenuPosition(position);
    setCurrentText(text);
    setContext(contextText);
    setIsMenuVisible(true);
  }, []);

  // Get cursor position from selection
  const getCursorPosition = useCallback((): SuggestionPosition => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      if (rect.width === 0 && rect.height === 0) {
        // Use the last known position if we can't get current position
        return lastCaretPosition.current;
      }
      
      const position = {
        x: rect.left + rect.width / 2,
        y: rect.top + window.scrollY
      };
      
      lastCaretPosition.current = position;
      return position;
    }
    
    return lastCaretPosition.current;
  }, []);

  // Handle text input change
  const handleTextChange = useCallback((
    text: string, 
    elementType: string,
    surroundingElements: any[] = []
  ) => {
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Hide menu while typing
    setIsMenuVisible(false);

    // Only show suggestions for meaningful text
    if (text.trim().length < 3) {
      return;
    }

    // Set timeout to show suggestions after user stops typing
    typingTimeoutRef.current = setTimeout(() => {
      const position = getCursorPosition();
      
      // Build context from surrounding elements
      const contextLines = surroundingElements
        .slice(-3) // Last 3 elements for context
        .map(el => `[${el.type}] ${el.content}`)
        .join('\n');
      
      const fullContext = `Element type: ${elementType}\nSurrounding context:\n${contextLines}`;
      
      showMenu(position, text, fullContext);
    }, 1500); // Show after 1.5 seconds of no typing

  }, [getCursorPosition, showMenu]);

  // Handle cursor movement
  const handleCursorMove = useCallback(() => {
    if (isMenuVisible) {
      const position = getCursorPosition();
      setMenuPosition(position);
    }
  }, [isMenuVisible, getCursorPosition]);

  // Handle key presses
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // Hide menu on Escape
    if (event.key === 'Escape') {
      hideMenu();
      return;
    }

    // Show menu manually with Ctrl+Space
    if (event.ctrlKey && event.code === 'Space') {
      event.preventDefault();
      const position = getCursorPosition();
      
      // Get current element's text
      const activeElement = document.activeElement as HTMLElement;
      const text = activeElement?.textContent || '';
      
      showMenu(position, text, 'Manual trigger');
    }
  }, [hideMenu, showMenu, getCursorPosition]);

  // Setup event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('selectionchange', handleCursorMove);

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('selectionchange', handleCursorMove);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [handleKeyPress, handleCursorMove]);

  return {
    isMenuVisible,
    menuPosition,
    currentText,
    context,
    hideMenu,
    showMenu,
    handleTextChange
  };
};