
import { useCallback, useRef, useState } from 'react';

export const useScriptCursor = () => {
  const [currentPosition, setCurrentPosition] = useState<number>(0);
  const paperRef = useRef<HTMLDivElement>(null);

  const updateCursorPosition = useCallback((elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      const paperRect = paperRef.current?.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      if (paperRect) {
        const relativePosition = elementRect.top - paperRect.top;
        setCurrentPosition(relativePosition);
      }
    }
  }, []);

  return {
    paperRef,
    currentPosition,
    updateCursorPosition
  };
};
