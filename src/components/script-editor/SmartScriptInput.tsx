import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useScriptAutoComplete } from '@/hooks/useScriptAutoComplete';
import { AutoCompleteDropdown } from './AutoCompleteDropdown';
import { ScriptElementType } from '@/hooks/useScriptContent';

interface SmartScriptInputProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onEnterPress?: () => void;
  placeholder?: string;
  elementType: ScriptElementType['type'];
  scriptElements: ScriptElementType[];
  className?: string;
}

// Helper function to save cursor position
const saveCursorPosition = (element: HTMLElement): number => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return 0;

  const range = selection.getRangeAt(0);
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(element);
  preCaretRange.setEnd(range.endContainer, range.endOffset);
  return preCaretRange.toString().length;
};

// Helper function to restore cursor position
const restoreCursorPosition = (element: HTMLElement, position: number) => {
  const selection = window.getSelection();
  if (!selection) return;

  let charCount = 0;
  let foundPosition = false;

  const traverseNodes = (node: Node): boolean => {
    if (node.nodeType === Node.TEXT_NODE) {
      const textLength = node.textContent?.length || 0;
      if (charCount + textLength >= position) {
        const range = document.createRange();
        range.setStart(node, Math.min(position - charCount, textLength));
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        return true;
      }
      charCount += textLength;
    } else {
      for (let i = 0; i < node.childNodes.length; i++) {
        if (traverseNodes(node.childNodes[i])) return true;
      }
    }
    return false;
  };

  traverseNodes(element);
};

export const SmartScriptInput = ({
  value,
  onChange,
  onFocus,
  onBlur,
  onEnterPress,
  placeholder,
  elementType,
  scriptElements,
  className
}: SmartScriptInputProps) => {
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const contentRef = useRef<HTMLDivElement>(null);
  const isInternalChangeRef = useRef(false);
  const lastValueRef = useRef(value);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const {
    suggestions,
    isVisible,
    showSuggestions,
    hideSuggestions
  } = useScriptAutoComplete(scriptElements);

  // Initialize content on mount
  useEffect(() => {
    if (contentRef.current && !contentRef.current.textContent) {
      contentRef.current.textContent = value;
    }
  }, []);

  // Update contentEditable div when value changes from parent (external changes only)
  useEffect(() => {
    if (!contentRef.current) return;

    const currentText = contentRef.current.textContent || '';

    // Don't update if:
    // 1. The change was internal (from user typing)
    // 2. User is actively typing (new protection)
    // 3. The element is currently focused
    // 4. The text hasn't actually changed
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      lastValueRef.current = value;
      return;
    }

    // CRITICAL: Block ALL updates while user is typing
    if (isTypingRef.current) {
      return;
    }

    if (currentText === value) {
      lastValueRef.current = value;
      return;
    }

    // Only sync from parent when not actively editing
    if (document.activeElement !== contentRef.current) {
      contentRef.current.textContent = value;
      lastValueRef.current = value;
    }
  }, [value]);

  // Calculate dropdown position based on cursor
  const updateDropdownPosition = useCallback(() => {
    if (!contentRef.current) return;

    const element = contentRef.current;
    const rect = element.getBoundingClientRect();

    setDropdownPosition({
      top: rect.bottom + 4,
      left: rect.left
    });
  }, []);

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const newValue = e.currentTarget.textContent || '';

    // Mark user as actively typing
    isTypingRef.current = true;

    // Clear previous typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to clear typing state after 500ms of no input
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
    }, 500);

    // Mark this as an internal change to prevent the useEffect from syncing
    isInternalChangeRef.current = true;
    onChange(newValue);

    // Show suggestions based on current input
    if (newValue.trim()) {
      const selection = window.getSelection();
      const cursorPosition = selection?.focusOffset || 0;
      showSuggestions(newValue, elementType, cursorPosition);
      updateDropdownPosition();
    } else {
      hideSuggestions();
    }
  }, [onChange, elementType, showSuggestions, hideSuggestions, updateDropdownPosition]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // Handle autocomplete suggestions first
    if (isVisible && suggestions.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedSuggestionIndex(prev =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          return;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedSuggestionIndex(prev =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          return;
        case 'Tab':
        case 'Enter':
          if (suggestions[selectedSuggestionIndex]) {
            e.preventDefault();
            applySuggestion(suggestions[selectedSuggestionIndex]);
            return;
          }
          break;
        case 'Escape':
          e.preventDefault();
          hideSuggestions();
          return;
      }
    }

    // Handle Enter key for creating new element (when no suggestions)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (onEnterPress) {
        onEnterPress();
      }
    }

    // Handle Backspace on empty element
    if (e.key === 'Backspace' && !value && !e.shiftKey) {
      // If we are already empty and hit backspace, trigger a change with empty string
      // This will be caught by the parent's handleContentChange as a deletion request
      onChange("");
    }
  }, [isVisible, suggestions, selectedSuggestionIndex, onEnterPress, hideSuggestions]);

  const applySuggestion = useCallback((suggestion: any) => {
    if (!contentRef.current) return;

    // Clear typing state since suggestion is being applied
    isTypingRef.current = false;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Update the content
    contentRef.current.textContent = suggestion.text;

    // Mark as internal change
    isInternalChangeRef.current = true;
    onChange(suggestion.text);

    hideSuggestions();
    setSelectedSuggestionIndex(0);

    // Keep focus and move cursor to end after applying suggestion
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.focus();
        // Move cursor to end
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(contentRef.current);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }, 0);
  }, [onChange, hideSuggestions]);

  const handleFocusInternal = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    updateDropdownPosition();
    if (onFocus) onFocus();
  }, [onFocus, updateDropdownPosition]);

  // Reset suggestion index when suggestions change
  useEffect(() => {
    setSelectedSuggestionIndex(0);
  }, [suggestions]);

  return (
    <div className="relative" dir="ltr">
      <div
        ref={contentRef}
        contentEditable
        dir="ltr"
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={handleFocusInternal}
        onBlur={onBlur} // Pass onBlur
        className={className}
        data-placeholder={placeholder}
        suppressContentEditableWarning
        style={{
          minHeight: '1.5em',
          outline: 'none',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          direction: 'ltr',
          textAlign: 'left',
          unicodeBidi: 'normal',
          writingMode: 'horizontal-tb'
        }}
      />


      <AutoCompleteDropdown
        suggestions={suggestions}
        isVisible={isVisible}
        selectedIndex={selectedSuggestionIndex}
        onSelect={applySuggestion}
        position={dropdownPosition}
      />
    </div>
  );
};
