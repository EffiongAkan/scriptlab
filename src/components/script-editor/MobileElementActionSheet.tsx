import React from 'react';
import { Sparkles, Quote, Trash2, X } from 'lucide-react';
import { ScriptElementType } from '@/hooks/useScriptContent';

interface MobileElementActionSheetProps {
  isOpen: boolean;
  elementId: string | null;
  elementType: ScriptElementType['type'] | null;
  elementContent: string;
  onClose: () => void;
  onModifyWithAI: (elementId: string, content: string) => void;
  onQuoteAndComment: (elementId: string, content: string) => void;
  onDelete?: (elementId: string) => void;
}

/**
 * Bottom action sheet that appears on mobile after long-pressing a script element.
 * Provides the same "Modify with AI" and "Quote & Comment" actions that are
 * available via text selection on desktop.
 */
export const MobileElementActionSheet: React.FC<MobileElementActionSheetProps> = ({
  isOpen,
  elementId,
  elementType,
  elementContent,
  onClose,
  onModifyWithAI,
  onQuoteAndComment,
  onDelete,
}) => {
  if (!isOpen || !elementId) return null;

  const preview = elementContent.length > 80
    ? elementContent.slice(0, 80) + '…'
    : elementContent;

  const typeLabel: Record<ScriptElementType['type'], string> = {
    heading: 'Scene Heading',
    action: 'Action',
    character: 'Character',
    dialogue: 'Dialogue',
    parenthetical: 'Parenthetical',
    transition: 'Transition',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1E1E1E] border-t border-gray-700 rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-300 pb-safe">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-600 rounded-full" />
        </div>

        {/* Element type label + preview */}
        <div className="px-5 pb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">
            {elementType ? typeLabel[elementType] : 'Element'}
          </p>
          {preview && (
            <p className="text-sm text-gray-300 line-clamp-2 italic">
              "{preview}"
            </p>
          )}
        </div>

        <div className="border-t border-gray-800" />

        {/* Actions */}
        <div className="px-4 py-3 space-y-2">
          <button
            onClick={() => {
              onModifyWithAI(elementId, elementContent);
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 active:bg-teal-600/40 text-teal-300 font-medium text-sm transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-600/30 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            Modify with AI
          </button>

          <button
            onClick={() => {
              onQuoteAndComment(elementId, elementContent);
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 active:bg-indigo-600/40 text-indigo-300 font-medium text-sm transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 flex items-center justify-center">
              <Quote className="h-4 w-4" />
            </div>
            Quote & Comment
          </button>

          {onDelete && (
            <button
              onClick={() => {
                if (confirm('Delete this element?')) {
                  onDelete(elementId);
                  onClose();
                }
              }}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-red-900/20 hover:bg-red-900/30 active:bg-red-900/40 text-red-400 font-medium text-sm transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-red-900/30 flex items-center justify-center">
                <Trash2 className="h-4 w-4" />
              </div>
              Delete Element
            </button>
          )}
        </div>

        {/* Cancel */}
        <div className="px-4 pb-4 pt-1">
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 font-medium text-sm transition-colors"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
        </div>
      </div>
    </>
  );
};
