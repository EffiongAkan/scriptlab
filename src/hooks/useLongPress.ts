import { useRef, useCallback } from 'react';

/**
 * useLongPress — fires onLongPress after the pointer/touch is held for `delay` ms.
 * Cancels if the pointer moves more than `moveThreshold` pixels.
 */
export function useLongPress(
  onLongPress: (e: React.TouchEvent | React.MouseEvent) => void,
  { delay = 500, moveThreshold = 10 }: { delay?: number; moveThreshold?: number } = {}
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const triggeredRef = useRef(false);

  const getCoords = (e: React.TouchEvent | React.MouseEvent) => {
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
  };

  const start = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    triggeredRef.current = false;
    startPosRef.current = getCoords(e);

    timerRef.current = setTimeout(() => {
      triggeredRef.current = true;
      onLongPress(e);
    }, delay);
  }, [onLongPress, delay]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const move = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!startPosRef.current) return;
    const { x, y } = getCoords(e);
    const dx = Math.abs(x - startPosRef.current.x);
    const dy = Math.abs(y - startPosRef.current.y);
    if (dx > moveThreshold || dy > moveThreshold) {
      stop();
    }
  }, [stop, moveThreshold]);

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchMove: move as any,
  };
}
