
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignJustify,
  Search, MessageSquare, Link2, Image as ImageIcon,
  Maximize2, Keyboard, ChevronDown, List, PanelLeft, PanelLeftClose, Plus, 
  Undo, Redo, SpellCheck
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ScriptFormatToolbarProps {
  zoom: string;
  onZoomChange: (value: string) => void;
  onInsertElement: (type: string) => void;
  onToggleSceneNav: () => void;
  isSceneNavOpen: boolean;
  activeElementType?: string | null;
  onChangeElementType?: (newType: string) => void;
  hideMobileSwitcher?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPrevPage?: () => void;
  onNextPage?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

const ELEMENT_TYPES = [
  { type: 'action', label: 'Action' },
  { type: 'heading', label: 'Scene Heading' },
  { type: 'character', label: 'Character' },
  { type: 'dialogue', label: 'Dialogue' },
  { type: 'parenthetical', label: 'Parenthetical' },
  { type: 'transition', label: 'Transition' },
];

export const ScriptFormatToolbar = ({
  zoom,
  onZoomChange,
  onInsertElement,
  onToggleSceneNav,
  isSceneNavOpen,
  activeElementType,
  onChangeElementType,
  hideMobileSwitcher,
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: ScriptFormatToolbarProps) => {

  const [isAutoCorrectEnabled, setIsAutoCorrectEnabled] = React.useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('autocorrect-enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  React.useEffect(() => {
    const handleToggle = () => {
      const saved = localStorage.getItem('autocorrect-enabled');
      const newState = saved !== null ? !JSON.parse(saved) : false;
      setIsAutoCorrectEnabled(newState);
    };
    document.addEventListener('autocorrect-toggle', handleToggle);
    return () => document.removeEventListener('autocorrect-toggle', handleToggle);
  }, []);

  const toggleAutoCorrect = () => {
    document.dispatchEvent(new CustomEvent('autocorrect-toggle'));
  };

  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  const handleInsertLink = () => {
    const url = prompt("Enter link URL:");
    if (url) handleFormat('createLink', url);
  };

  const handleInsertImage = () => {
    const url = prompt("Enter image URL:");
    if (url) handleFormat('insertImage', url);
  };

  const currentTypeLabel = ELEMENT_TYPES.find(t => t.type === activeElementType)?.label ?? 'Action';

  const ToolbarButton = ({ icon: Icon, tooltip, onClick, active, disabled }: { icon: any, tooltip: string, onClick?: () => void, active?: boolean, disabled?: boolean }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-9 w-9 text-gray-400 hover:text-white hover:bg-white/5 transition-colors",
              active && "text-white bg-white/10"
            )}
            onClick={onClick}
            disabled={disabled}
            onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
          >
            <Icon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="w-full bg-[#111827] border-y border-white/5 flex flex-col">
      {/* Main Toolbar Row - Allow horizontal scroll on very small screens */}
      <div className="px-4 py-2 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
        {/* Left Section: Element Dropdown & Formatting */}
        <div className="flex items-center gap-2 flex-nowrap shrink-0">
          {/* Scene nav toggle moved to floating button in ScriptContentContainer */}
          
          <div className="h-6 w-[1px] bg-white/10 mx-1" />

          {/* History Group */}
          <div className="flex items-center gap-0.5">
            <ToolbarButton icon={Undo} tooltip="Undo (Ctrl+Z)" onClick={onUndo} disabled={!canUndo} />
            <ToolbarButton icon={Redo} tooltip="Redo (Ctrl+Y)" onClick={onRedo} disabled={!canRedo} />
          </div>

          <div className="h-6 w-[1px] bg-white/10 mx-1" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-9 px-3 bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white flex items-center gap-2 min-w-[120px] justify-between font-medium"
              >
                <span>{currentTypeLabel}</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-[#1f2937] border-white/10 text-gray-300">
              {ELEMENT_TYPES.map((type) => (
                <DropdownMenuItem
                  key={type.type}
                  onClick={() => onChangeElementType?.(type.type)}
                  className="hover:bg-white/5 hover:text-white cursor-pointer"
                >
                  {type.label}
                </DropdownMenuItem>
              ))}
              <div className="border-t border-white/5 my-1" />
              <DropdownMenuItem onClick={() => onInsertElement('heading')} className="cursor-pointer hover:bg-white/5">
                <Plus className="h-4 w-4 mr-2" /> Insert Element
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-6 w-[1px] bg-white/10 mx-1" />

          {/* Formatting Group */}
          <div className="flex items-center gap-0.5">
            <ToolbarButton icon={Bold} tooltip="Bold (Ctrl+B)" onClick={() => handleFormat('bold')} />
            <ToolbarButton icon={Italic} tooltip="Italic (Ctrl+I)" onClick={() => handleFormat('italic')} />
            <ToolbarButton icon={Underline} tooltip="Underline (Ctrl+U)" onClick={() => handleFormat('underline')} />
            <ToolbarButton icon={Link2} tooltip="Link" onClick={handleInsertLink} />
            <ToolbarButton icon={ImageIcon} tooltip="Image" onClick={handleInsertImage} />
          </div>

          <div className="h-6 w-[1px] bg-white/10 mx-1" />

          {/* Alignment Group */}
          <div className="flex items-center gap-0.5">
            <ToolbarButton icon={AlignLeft} tooltip="Align Left" onClick={() => handleFormat('justifyLeft')} />
            <ToolbarButton icon={AlignCenter} tooltip="Align Center" onClick={() => handleFormat('justifyCenter')} />
            <ToolbarButton icon={AlignJustify} tooltip="Justify" onClick={() => handleFormat('justifyFull')} />
            <ToolbarButton icon={List} tooltip="Bullet List" onClick={() => handleFormat('insertUnorderedList')} />
          </div>

          <div className="h-6 w-[1px] bg-white/10 mx-1" />

          {/* Text Style Group */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 px-3 text-gray-400 hover:text-white hover:bg-white/5 flex items-center gap-2 font-bold"
              >
                <span>AA</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#1f2937] border-white/10 text-gray-300">
              <DropdownMenuItem 
                className="hover:bg-white/5 hover:text-white cursor-pointer"
                onClick={() => document.dispatchEvent(new CustomEvent('script-transform-case', { detail: { mode: 'uppercase' } }))}
              >
                UPPERCASE
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="hover:bg-white/5 hover:text-white cursor-pointer"
                onClick={() => document.dispatchEvent(new CustomEvent('script-transform-case', { detail: { mode: 'lowercase' } }))}
              >
                lowercase
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="hover:bg-white/5 hover:text-white cursor-pointer"
                onClick={() => document.dispatchEvent(new CustomEvent('script-transform-case', { detail: { mode: 'sentence' } }))}
              >
                Sentence case
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-6 w-[1px] bg-white/10 mx-1" />

          <ToolbarButton 
            icon={SpellCheck} 
            tooltip={`Auto-Correct: ${isAutoCorrectEnabled ? 'ON' : 'OFF'}`} 
            onClick={toggleAutoCorrect} 
            active={isAutoCorrectEnabled}
          />

          <ToolbarButton 
            icon={MessageSquare} 
            tooltip="Comments" 
            onClick={() => document.dispatchEvent(new CustomEvent('toggle-comments-sidebar'))} 
          />
        </div>

        {/* Right Section: Controls */}
        <div className="flex items-center gap-3 flex-nowrap shrink-0 ml-auto">
          {/* Pagination Controls moved to floating buttons in ScriptContentContainer */}

          <Button
            variant="secondary"
            className="h-9 bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white flex items-center gap-2 text-xs font-medium"
          >
            <Keyboard className="h-4 w-4" />
            Shortcuts
          </Button>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-white">
              <Search className="h-4 w-4" />
            </Button>

            <Select value={zoom} onValueChange={onZoomChange}>
              <SelectTrigger className="h-9 w-[90px] bg-white/5 border-white/10 text-gray-300 hover:bg-white/10">
                <SelectValue placeholder={zoom} />
              </SelectTrigger>
              <SelectContent className="bg-[#1f2937] border-white/10 text-gray-300">
                <SelectItem value="75%">75%</SelectItem>
                <SelectItem value="100%">100%</SelectItem>
                <SelectItem value="125%">125%</SelectItem>
                <SelectItem value="150%">150%</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-white">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile element type switcher intentionally removed for cleaner mobile UX */}
    </div>
  );
};
