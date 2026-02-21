import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * FloatingPanel: Makes any children floatable & draggable on the screen.
 *
 * Usage:
 * <FloatingPanel>
 *   <YourPanelComponent />
 * </FloatingPanel>
 */
interface FloatingPanelProps {
  children: React.ReactNode;
  initialPosition?: { x: number; y: number };
  className?: string;
}

export const FloatingPanel: React.FC<FloatingPanelProps> = ({
  children,
  initialPosition = { x: 80, y: 80 },
  className = ""
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement | null>(null);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      setDragging(true);
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (dragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  React.useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    // eslint-disable-next-line
  }, [dragging, dragOffset]);

  // Accessibility: basic focus trap when open
  const panelRefCb = (node: HTMLDivElement | null) => {
    if (node) {
      node.setAttribute("role", "dialog");
      node.setAttribute("aria-modal", "true");
      node.setAttribute("tabindex", "-1");
      node.setAttribute("aria-label", "Floating suggestions panel");
      // Focus the panel on mount
      node.focus();
    }
    panelRef.current = node;
  };

  return (
    <div
      ref={panelRefCb}
      className={cn(
        "fixed z-[110] max-w-[95vw] top-0 left-0 shadow-2xl rounded-lg bg-background border transition-all",
        dragging ? "cursor-grabbing opacity-90" : "cursor-grab",
        className
      )}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
      tabIndex={-1}
    >
      {/* Handle bar for dragging */}
      <div
        className="w-full h-8 cursor-grab active:cursor-grabbing pl-4 flex items-center rounded-t-lg bg-muted border-b select-none"
        onMouseDown={handleMouseDown}
        style={{
          userSelect: "none",
        }}
        aria-label="Drag to move"
      >
        <span className="font-semibold text-sm text-muted-foreground tracking-wide select-none">
          Floating Suggestions
        </span>
      </div>
      <div className="relative">
        {children}
      </div>
    </div>
  );
};
