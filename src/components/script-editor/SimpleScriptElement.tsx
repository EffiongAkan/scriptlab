
import React, { useState, useCallback, useEffect } from 'react';
import { SmartScriptInput } from './SmartScriptInput';
import { ScriptElementType } from '@/hooks/useScriptContent';
import { useScriptEditor } from '@/contexts/ScriptEditorContext';
import { cn } from '@/lib/utils';

interface SimpleScriptElementProps {
  id: string;
  type: ScriptElementType['type'];
  content: string;
  onChange: (id: string, content: string) => void;
  onFocus: () => void;
  onEnterPress?: (currentId: string) => void;
  revision?: number;
  scriptElements: ScriptElementType[]; // Full list for autocomplete
}

export const SimpleScriptElement = ({
  id,
  type,
  content,
  onChange,
  onFocus,
  onEnterPress,
  revision,
  scriptElements,
}: SimpleScriptElementProps) => {
  const [localContent, setLocalContent] = useState(content);
  const { focusedElementId, setFocusedElementId } = useScriptEditor();

  const isFocused = focusedElementId === id;

  // Sync content from parent
  useEffect(() => {
    // If not focused, always sync
    // If focused, only sync if the revision changed (meaning a history action or external structure change occurred)
    if (!isFocused) {
      setLocalContent(content);
    }
  }, [content, isFocused]);

  // Force sync when revision changes (Undo/Redo)
  useEffect(() => {
    if (revision !== undefined) {
      console.log(`Force-syncing element ${id} due to history revision ${revision}`);
      setLocalContent(content);
    }
  }, [revision]); // Specifically sync when revision changes, regardless of focus

  const handleContentChange = useCallback((newContent: string) => {
    setLocalContent(newContent);
    // Auto-save on change (debounced in parent component)
    onChange(id, newContent);
  }, [id, onChange]);

  const handleFocusInternal = useCallback(() => {
    setFocusedElementId(id);
    onFocus();
  }, [id, onFocus, setFocusedElementId]);

  const handleEnter = useCallback(() => {
    if (onEnterPress) {
      onEnterPress(id);
    }
  }, [id, onEnterPress]);

  const getElementStyle = () => {
    switch (type) {
      case 'heading':
        return 'font-bold text-left uppercase tracking-wide font-screenplay mt-6 mb-2';
      case 'character':
        return 'font-bold text-left uppercase tracking-wide ml-8 sm:ml-20 md:ml-40 font-screenplay mt-4';
      case 'dialogue':
        return 'text-left ml-4 sm:ml-12 md:ml-24 mr-4 sm:mr-10 md:mr-20 max-w-[35rem] font-screenplay font-normal mb-2';
      case 'parenthetical':
        return 'italic text-left ml-6 sm:ml-16 md:ml-32 mr-6 sm:mr-16 md:mr-32 max-w-[25rem] font-screenplay mb-1';
      case 'action':
        return 'text-left font-screenplay mb-4 leading-relaxed';
      case 'transition':
        return 'font-bold text-right uppercase tracking-wide font-screenplay my-4 w-full pr-4';
      default:
        return 'font-screenplay';
    }
  };

  const getPlaceholder = () => {
    switch (type) {
      case 'heading':
        return 'FADE IN: or INT./EXT. LOCATION - TIME';
      case 'character':
        return 'CHARACTER NAME';
      case 'dialogue':
        return 'Character dialogue...';
      case 'parenthetical':
        return '(action or emotion)';
      case 'action':
        return 'Scene description or action...';
      case 'transition':
        return 'CUT TO: or FADE OUT:';
      default:
        return 'Enter content...';
    }
  };

  return (
    <>
      <div className={cn("py-1", getElementStyle())} dir="ltr">
        <SmartScriptInput
          value={localContent}
          onChange={handleContentChange}
          onFocus={handleFocusInternal}
          onEnterPress={handleEnter}
          placeholder={getPlaceholder()}
          elementType={type}
          scriptElements={scriptElements}
          className={cn(
            "w-full font-screenplay",
            "focus:outline-none",
            "empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400",
            isFocused && "bg-blue-50/30"
          )}
        />
      </div>
    </>
  );
};
