
import React from "react";
import { Button } from "@/components/ui/button";
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight, ZoomIn, ZoomOut, PanelLeft, PanelLeftClose, Type, ListChecks, Camera, MessageSquare, Plus, Keyboard, CaseUpper, CaseLower } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ScriptFormatToolbarProps {
  zoom: string;
  onZoomChange: (value: string) => void;
  onInsertElement: (type: string) => void;
  onToggleSceneNav: () => void;
  isSceneNavOpen: boolean;
  /** Type of the currently focused script element (mobile type-switcher) */
  activeElementType?: string | null;
  /** Called when user taps a type chip in the mobile type-switcher */
  onChangeElementType?: (newType: string) => void;
  /** If true, the mobile type switcher will be hidden (useful when other menus are active) */
  hideMobileSwitcher?: boolean;
}

export const ScriptFormatToolbar = ({
  zoom,
  onZoomChange,
  onInsertElement,
  onToggleSceneNav,
  isSceneNavOpen,
  activeElementType,
  onChangeElementType,
  hideMobileSwitcher,
}: ScriptFormatToolbarProps) => {
  const ELEMENT_TYPES = [
    { type: 'heading', label: 'H', fullLabel: 'Scene Heading' },
    { type: 'action', label: 'A', fullLabel: 'Action' },
    { type: 'character', label: 'C', fullLabel: 'Character' },
    { type: 'dialogue', label: 'D', fullLabel: 'Dialogue' },
    { type: 'parenthetical', label: 'P', fullLabel: 'Parenthetical' },
    { type: 'transition', label: 'T', fullLabel: 'Transition' },
  ];

  return (
    <div className="bg-[#1E1E1E] md:border-b border-gray-800 shadow-sm">
      {/* Mobile-only: Element Type Quick-Switcher */}
      {onChangeElementType && !hideMobileSwitcher && (
        <div className="sm:hidden flex items-center justify-center gap-1.5 px-3 py-2 border-b border-gray-800/60 overflow-x-auto min-w-full">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest shrink-0 mr-1">Type:</span>
          {ELEMENT_TYPES.map(({ type, label, fullLabel }) => {
            const isActive = activeElementType === type;
            return (
              <button
                key={type}
                onClick={() => onChangeElementType(type)}
                className={`shrink-0 h-8 px-3 rounded-full text-xs font-bold border transition-colors touch-manipulation ${isActive
                    ? 'bg-naija-green text-white border-naija-green shadow-lg shadow-naija-green/30'
                    : 'bg-gray-800/70 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-gray-200'
                  }`}
                title={fullLabel}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Main toolbar row */}
      <div className="py-1 px-2 md:p-2 flex flex-wrap items-center justify-between gap-1">
        {/* Left section: Scene Nav Toggle */}
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 sm:h-8 sm:w-8 touch-manipulation text-gray-400 hover:text-white"
                  onClick={onToggleSceneNav}
                >
                  {isSceneNavOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isSceneNavOpen ? "Hide" : "Show"} scene navigation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Middle section: Insert Elements - Dropdown on mobile, individual buttons on desktop */}
        <div className="flex items-center gap-1">
          {/* Mobile: Dropdown Menu */}
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 touch-manipulation text-gray-400 hover:text-white">
                  <Plus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-[#1E1E1E] border-gray-800 text-gray-300">
                <DropdownMenuItem onClick={() => onInsertElement('heading')} className="cursor-pointer py-3 hover:bg-gray-800 focus:bg-gray-800">
                  <Type className="h-4 w-4 mr-2" />
                  <span>Scene Heading</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onInsertElement('action')} className="cursor-pointer py-3 hover:bg-gray-800 focus:bg-gray-800">
                  <ListChecks className="h-4 w-4 mr-2" />
                  <span>Action</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onInsertElement('character')} className="cursor-pointer py-3 hover:bg-gray-800 focus:bg-gray-800">
                  <Camera className="h-4 w-4 mr-2" />
                  <span>Character</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onInsertElement('dialogue')} className="cursor-pointer py-3 hover:bg-gray-800 focus:bg-gray-800">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  <span>Dialogue</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="hidden sm:flex items-center gap-1">
            {[
              { type: 'heading', icon: Type, label: 'Add Scene Heading' },
              { type: 'action', icon: ListChecks, label: 'Add Action' },
              { type: 'character', icon: Camera, label: 'Add Character' },
              { type: 'dialogue', icon: MessageSquare, label: 'Add Dialogue' },
            ].map((item) => (
              <TooltipProvider key={item.type}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-white"
                      onClick={() => onInsertElement(item.type)}
                    >
                      <item.icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}

            <div className="w-[1px] h-4 bg-gray-700 mx-1" />

            {/* Case Transformations */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-white"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      const event = new CustomEvent('script-transform-case', { detail: { mode: 'uppercase' } });
                      document.dispatchEvent(event);
                    }}
                  >
                    <CaseUpper className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Uppercase (Ctrl+Shift+U)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-white"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      const event = new CustomEvent('script-transform-case', { detail: { mode: 'lowercase' } });
                      document.dispatchEvent(event);
                    }}
                  >
                    <CaseLower className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Lowercase (Ctrl+Shift+L)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Right section: Shortcuts & Zoom Controls (Hidden on mobile) */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Shortcuts Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white bg-gray-800/50"
                  onClick={() => {
                    // Could open a help dialog here
                  }}
                >
                  <Keyboard className="h-3.5 w-3.5" />
                  <span>Shortcuts</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-[#1E1E1E] border-gray-800 text-gray-300">
                <div className="space-y-1">
                  <p className="font-semibold mb-1">Keyboard Shortcuts:</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <span>Heading: Ctrl/⌘+H</span>
                    <span>Action: Ctrl/⌘+A</span>
                    <span>Character: Ctrl/⌘+C</span>
                    <span>Dialogue: Ctrl/⌘+D</span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="w-[1px] h-4 bg-gray-700 mx-1 hidden sm:block" />

          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-white"
                    onClick={() => {
                      const newZoom = Math.max(50, parseInt(zoom) - 10);
                      onZoomChange(`${newZoom}%`);
                    }}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Zoom Out</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Select value={zoom} onValueChange={onZoomChange}>
              <SelectTrigger className="w-[70px] sm:w-[80px] h-8 text-[11px] bg-gray-800 border-gray-700 text-gray-300">
                <SelectValue placeholder={zoom} />
              </SelectTrigger>
              <SelectContent className="bg-[#1E1E1E] border-gray-800 text-gray-300">
                <SelectItem value="50%">50%</SelectItem>
                <SelectItem value="75%">75%</SelectItem>
                <SelectItem value="100%">100%</SelectItem>
                <SelectItem value="125%">125%</SelectItem>
                <SelectItem value="150%">150%</SelectItem>
              </SelectContent>
            </Select>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-white"
                    onClick={() => {
                      const newZoom = Math.min(200, parseInt(zoom) + 10);
                      onZoomChange(`${newZoom}%`);
                    }}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Zoom In</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>

  );
};
