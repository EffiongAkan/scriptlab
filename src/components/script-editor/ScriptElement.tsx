
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { SmartScriptInput } from './SmartScriptInput';
import { ScriptElementType } from '@/hooks/useScriptContent';
import { useScriptEditor } from '@/contexts/ScriptEditorContext';
import { cn } from '@/lib/utils';

interface ScriptElementProps {
  element: ScriptElementType;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (content: string) => void;
  onCancel: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  scriptElements: ScriptElementType[];
  onFocus?: () => void;
}

export const ScriptElement = ({
  element,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onKeyDown,
  scriptElements,
  onFocus
}: ScriptElementProps) => {
  const [content, setContent] = useState(element.content || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const { focusedElementId } = useScriptEditor();

  const isFocused = focusedElementId === element.id;

  // Reset content when element changes
  useEffect(() => {
    setContent(element.content || '');
  }, [element.content]);

  const handleSave = useCallback(() => {
    onSave(content.trim());
  }, [content, onSave]);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
  }, []);

  const handleCancel = useCallback(() => {
    setContent(element.content || '');
    onCancel();
  }, [element.content, onCancel]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    } else {
      onKeyDown(e);
    }
  }, [handleSave, handleCancel, onKeyDown]);

  const getElementStyle = () => {
    switch (element.type) {
      case 'heading':
        return 'font-bold text-center uppercase tracking-wide font-screenplay';
      case 'character':
        return 'font-bold text-center uppercase tracking-wide ml-20 font-screenplay';
      case 'dialogue':
        return 'text-center mx-auto max-w-md font-screenplay font-normal';
      case 'parenthetical':
        return 'italic text-center ml-15 mr-15 font-screenplay';
      case 'action':
        return 'ml-5 mr-5 font-screenplay';
      case 'transition':
        return 'font-bold text-right uppercase tracking-wide font-screenplay';
      default:
        return 'font-screenplay';
    }
  };

  const getPlaceholder = () => {
    switch (element.type) {
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

  if (isEditing) {
    return (
      <div className={cn("py-1", getElementStyle())}>
        <SmartScriptInput
          value={content}
          onChange={handleContentChange}
          onBlur={handleSave}
          onFocus={onFocus}
          placeholder={getPlaceholder()}
          elementType={element.type}
          scriptElements={scriptElements}
          className="w-full bg-transparent border-none focus:ring-1 focus:ring-blue-500 font-screenplay"
          autoFocus
        />
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "py-1 cursor-pointer min-h-[1.5rem] transition-colors",
          getElementStyle(),
          isFocused && "bg-blue-50 ring-1 ring-blue-300",
          !element.content && "text-gray-400"
        )}
        onClick={onEdit}
        onFocus={onFocus}
        tabIndex={0}
      >
        {element.content || getPlaceholder()}
      </div>
    </>
  );
};
