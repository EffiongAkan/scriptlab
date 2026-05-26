import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useScriptAutoComplete } from '@/hooks/useScriptAutoComplete';
import { AutoCompleteDropdown } from './AutoCompleteDropdown';
import { ScriptElementType } from '@/hooks/useScriptContent';
import { useAutoCorrect } from '@/hooks/useAutoCorrect';
import { AutoCorrectUndoPill } from './AutoCorrectUndoPill';
import { ScriptAutocorrectBubble } from './ScriptAutocorrectBubble';
import { useScriptEditor } from '@/contexts/ScriptEditorContext';
import { useCollaborativeCursor } from '@/hooks/useCollaborativeCursor';

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
  id?: string;
}

// Helper function to save cursor position (cross-browser robust)
const saveCursorPosition = (element: HTMLElement): number => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return 0;

  const range = selection.getRangeAt(0);
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(element);
  
  try {
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    // Use innerText for more consistent character counting across browsers
    // but fall back to textContent if innerText is not exactly what we need
    return preCaretRange.toString().length;
  } catch (e) {
    return 0;
  }
};

// Helper function to restore cursor position (cross-browser robust)
const restoreCursorPosition = (element: HTMLElement, position: number) => {
  const selection = window.getSelection();
  if (!selection) return;

  let charCount = 0;
  const range = document.createRange();

  const traverseNodes = (node: Node): boolean => {
    if (node.nodeType === Node.TEXT_NODE) {
      const textLength = node.textContent?.length || 0;
      if (charCount + textLength >= position) {
        range.setStart(node, Math.max(0, position - charCount));
        range.collapse(true);
        return true;
      }
      charCount += textLength;
    } else {
      for (let i = 0; i < node.childNodes.length; i++) {
        if (traverseNodes(node.childNodes[i])) return true;
      }
      // Handle empty elements or <br> as having 0 length but valid positions
      if (node.nodeName === 'BR' && charCount === position) {
          range.setStartAfter(node);
          range.collapse(true);
          return true;
      }
    }
    return false;
  };

  traverseNodes(element);
  
  try {
    selection.removeAllRanges();
    selection.addRange(range);
  } catch (e) {
    console.warn('[SmartScriptInput] Failed to restore selection:', e);
  }
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
  className,
  id
}: SmartScriptInputProps) => {
  const { focusedElementId, setFocusedElementId } = useScriptEditor();
  const { updateSelectionPosition } = useCollaborativeCursor();
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

  const { autoCorrectText, getSuggestion, isEnabled } = useAutoCorrect(scriptElements);
  const [lastCorrection, setLastCorrection] = useState<{
    original: string;
    corrected: string;
    position: { top: number; left: number };
  } | null>(null);

  const [pendingSuggestion, setPendingSuggestion] = useState<{
    original: string;
    suggestion: string;
    position: { top: number; left: number };
  } | null>(null);

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

  // Handle case transformations (Uppercase/Lowercase)
  useEffect(() => {
    const handleTransformCase = (event: any) => {
      // Use focusedElementId check instead of document.activeElement
      if (id !== focusedElementId) return;

      const { mode } = event.detail;
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const selectedText = range.toString();

      if (!selectedText) return;

      const transformedText = mode === 'uppercase'
        ? selectedText.toUpperCase()
        : mode === 'lowercase'
        ? selectedText.toLowerCase()
        : selectedText.charAt(0).toUpperCase() + selectedText.slice(1).toLowerCase();

      // Delete the current selection and insert the transformed text
      range.deleteContents();
      const textNode = document.createTextNode(transformedText);
      range.insertNode(textNode);

      // Select the transformed text back
      const newRange = document.createRange();
      newRange.setStart(textNode, 0);
      newRange.setEnd(textNode, transformedText.length);
      selection.removeAllRanges();
      selection.addRange(newRange);

      // Trigger change
      const newValue = contentRef.current?.textContent || '';

      // Mark user as actively typing to block incoming syncs
      isTypingRef.current = true;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
      }, 500);

      isInternalChangeRef.current = true;
      onChange(newValue);
    };

    document.addEventListener('script-transform-case' as any, handleTransformCase);
    return () => document.removeEventListener('script-transform-case' as any, handleTransformCase);
  }, [onChange]);

  // Calculate dropdown position based on cursor
  const updateDropdownPosition = useCallback(() => {
    if (!contentRef.current) return;

    const element = contentRef.current;

    // The dropdown is absolute inside a relative container, 
    // so we position it relative to the element's bottom.
    setDropdownPosition({
      top: element.offsetHeight + 2,
      left: 0
    });
  }, []);

  const handleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    let newValue = (e.currentTarget.textContent || '').replace(/\u00A0/g, ' ');
    
    // Save current cursor before updating
    let cursorPos = saveCursorPosition(e.currentTarget);
    
    // Proactive Suggestion Logic
    if (cursorPos > 0 && isEnabled) {
      const currentContent = newValue;
      const beforeCursor = currentContent.slice(0, cursorPos);
      const match = beforeCursor.match(/(\w+)$/);
      
      if (match) {
        const currentWord = match[1];
        const lastChar = newValue.charAt(cursorPos - 1);
        
        // If they just typed a non-word char, we might trigger the instant replace
        if (/[\s.,!?]/.test(lastChar)) {
          const textUpToCursor = newValue.slice(0, cursorPos - 1);
          const { corrected, correction } = autoCorrectText(textUpToCursor, lastChar, elementType);
          
          if (correction && corrected !== textUpToCursor + lastChar) {
            const fullCorrected = corrected + newValue.slice(cursorPos);
            
            let pillPos = { top: 0, left: 0 };
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0 && contentRef.current) {
               const rect = selection.getRangeAt(0).getBoundingClientRect();
               const parentRect = contentRef.current.getBoundingClientRect();
               pillPos = {
                  top: rect.bottom - parentRect.top,
                  left: rect.left - parentRect.left
               };
            }

            e.currentTarget.textContent = fullCorrected;
            const lengthDiff = correction.corrected.length - correction.original.length;
            cursorPos = cursorPos + lengthDiff;
            restoreCursorPosition(e.currentTarget, cursorPos);
            
            newValue = fullCorrected;
            setPendingSuggestion(null); // Clear pending if we auto-replaced
            
            setLastCorrection({
              original: correction.original,
              corrected: correction.corrected,
              position: pillPos
            });
          } else {
            setPendingSuggestion(null);
          }
        } else if (currentWord.length >= 2) {
          // Check for proactive suggestion
          const suggestion = getSuggestion(currentWord, elementType);
          if (suggestion && suggestion.toLowerCase() !== currentWord.toLowerCase()) {
            // Calculate position
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0 && contentRef.current) {
              const range = selection.getRangeAt(0).cloneRange();
              let rect = range.getBoundingClientRect();
              
              // If rect is empty (at line start), try to get from selection
              if (rect.width === 0 && rect.height === 0) {
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0) {
                  rect = sel.getRangeAt(0).getBoundingClientRect();
                }
              }

              const parentRect = contentRef.current.getBoundingClientRect();
              
              setPendingSuggestion({
                original: currentWord,
                suggestion: suggestion,
                position: {
                  top: rect.top - parentRect.top,
                  left: rect.left - parentRect.left
                }
              });
            }
          } else {
            setPendingSuggestion(null);
          }
        }
 else {
          setPendingSuggestion(null);
        }
      } else {
        setPendingSuggestion(null);
      }
    } else {
      setPendingSuggestion(null);
    }

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

    // Only update and trigger onChange if value actually changed
    // OR if this was triggered internally (e.g. by auto-correct)
    if (newValue !== lastValueRef.current || isInternalChangeRef.current) {
      // IF this was an internal change, we already updated the DOM, so we just
      // reset the flag and update the lastValueRef
      if (isInternalChangeRef.current) {
        isInternalChangeRef.current = false;
        lastValueRef.current = newValue;
        return;
      }

      lastValueRef.current = newValue;
      onChange(newValue);
    }

    // Show suggestions based on current input
    if (newValue.trim()) {
      const selection = window.getSelection();
      const cursorPosition = selection?.focusOffset || 0;
      showSuggestions(newValue, elementType, cursorPosition);
      updateDropdownPosition();
    } else {
      hideSuggestions();
    }
    
    // Broadcast cursor position during typing
    if (id) {
        updateSelectionPosition(id);
    }
  }, [onChange, elementType, showSuggestions, hideSuggestions, updateDropdownPosition, autoCorrectText, id, updateSelectionPosition]);

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
          setPendingSuggestion(null);
          return;
      }
    }

    // Handle proactive suggestion acceptance on Space/Enter
    if (pendingSuggestion && (e.key === ' ' || e.key === 'Enter')) {
      e.preventDefault();
      applyPendingSuggestion();
      return;
    }

    // Handle Tab key for script element cycling (when no suggestions)
    if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      
      const activeContainer = e.currentTarget.closest('[data-element-type]');
      if (activeContainer) {
        const elementId = activeContainer.getAttribute('data-element-id');
        const currentType = activeContainer.getAttribute('data-element-type');

        if (elementId && currentType) {
          const formatEvent = new CustomEvent('script-format-change', {
            detail: { id: elementId, currentType }
          });
          document.dispatchEvent(formatEvent);
        }
      }
      return;
    }

    // Handle Enter key for creating new element (when no suggestions)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      // Attempt auto-correction before moving to next element
      const currentValue = (contentRef.current?.textContent || '').replace(/\u00A0/g, ' ');
      if (currentValue.trim()) {
        const { corrected, correction } = autoCorrectText(currentValue, '', elementType);
        if (correction) {
          isInternalChangeRef.current = true;
          if (contentRef.current) contentRef.current.textContent = corrected;
          onChange(corrected);
        }
      }

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
  }, [isVisible, suggestions, selectedSuggestionIndex, onEnterPress, hideSuggestions, autoCorrectText, elementType, onChange, value]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    const text = e.clipboardData.getData('text/plain');
    if (!text) return;

    if (text.includes('\n')) {
      e.preventDefault();
      
      const activeContainer = e.currentTarget.closest('[data-element-id]');
      const elementId = activeContainer?.getAttribute('data-element-id');

      if (elementId) {
        const pasteEvent = new CustomEvent('script-paste-bulk', {
          detail: { text, elementId }
        });
        document.dispatchEvent(pasteEvent);
      }
    }
  }, []);

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

  const applyPendingSuggestion = useCallback(() => {
    if (!pendingSuggestion || !contentRef.current) return;

    const currentText = contentRef.current.textContent || '';
    const cursorPos = saveCursorPosition(contentRef.current);
    const beforeCursor = currentText.slice(0, cursorPos);
    const afterCursor = currentText.slice(cursorPos);
    
    // Find the word to replace
    const match = beforeCursor.match(/(\w+)$/);
    if (match) {
      const originalWord = match[1];
      const newBeforeCursor = beforeCursor.slice(0, -originalWord.length) + pendingSuggestion.suggestion;
      const newText = newBeforeCursor + afterCursor;
      
      contentRef.current.textContent = newText;
      
      const lengthDiff = pendingSuggestion.suggestion.length - originalWord.length;
      restoreCursorPosition(contentRef.current, cursorPos + lengthDiff);
      
      isInternalChangeRef.current = true;
      lastValueRef.current = newText;
      onChange(newText);
      
      setLastCorrection({
        original: originalWord,
        corrected: pendingSuggestion.suggestion,
        position: pendingSuggestion.position
      });
    }
    
    setPendingSuggestion(null);
  }, [pendingSuggestion, onChange]);

  const handleFocusInternal = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    if (id) setFocusedElementId(id);
    updateDropdownPosition();
    if (onFocus) onFocus();
  }, [id, onFocus, updateDropdownPosition, setFocusedElementId]);

  // Reset suggestion index when suggestions change
  useEffect(() => {
    setSelectedSuggestionIndex(0);
  }, [suggestions]);

  const handleUndoCorrection = useCallback(() => {
      if (!lastCorrection || !contentRef.current) return;
      
      const currentText = contentRef.current.textContent || '';
      // We need to replace the last occurrence of the corrected word with the original word.
      // But it's safer to just look backwards from the cursor if possible, or simple replace last match.
      const cursorPos = saveCursorPosition(contentRef.current);
      
      // Simple backwards replace: we know the corrected word was just typed
      const lastIndex = currentText.lastIndexOf(lastCorrection.corrected);
      if (lastIndex !== -1) {
          const newText = currentText.substring(0, lastIndex) + lastCorrection.original + currentText.substring(lastIndex + lastCorrection.corrected.length);
          contentRef.current.textContent = newText;
          
          const lengthDiff = lastCorrection.original.length - lastCorrection.corrected.length;
          restoreCursorPosition(contentRef.current, cursorPos + lengthDiff);
          
          isInternalChangeRef.current = true;
          lastValueRef.current = newText;
          onChange(newText);
      }
      setLastCorrection(null);
  }, [lastCorrection, onChange]);

  return (
    <div className="relative" dir="ltr">
      <div
        ref={contentRef}
        contentEditable
        dir="ltr"
        spellCheck={isEnabled}
        lang="en"
        autoCorrect={isEnabled ? "on" : "off"}
        autoCapitalize={isEnabled ? "on" : "off"}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onFocus={handleFocusInternal}
        onBlur={onBlur} // Pass onBlur
        onKeyUp={() => id && updateSelectionPosition(id)}
        onMouseUp={() => id && updateSelectionPosition(id)}
        className={className}
        data-placeholder={placeholder}
        id={id}
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

      {pendingSuggestion && (
        <ScriptAutocorrectBubble
          original={pendingSuggestion.original}
          suggestion={pendingSuggestion.suggestion}
          position={pendingSuggestion.position}
          onApply={applyPendingSuggestion}
          onDismiss={() => setPendingSuggestion(null)}
        />
      )}

      {lastCorrection && (
        <AutoCorrectUndoPill
          original={lastCorrection.original}
          corrected={lastCorrection.corrected}
          onUndo={handleUndoCorrection}
          position={lastCorrection.position}
        />
      )}
    </div>
  );
};
