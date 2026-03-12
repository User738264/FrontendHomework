import { useState, useEffect, useCallback } from 'react';
import { type Position, type Size, type ResizeDirection } from '../types';

interface ResizeState {
  isResizing: boolean;
  startX: number;
  startY: number;
  startPosition: Position;
  startSize: Size;
  direction: ResizeDirection;
}

export function useResize(
  initialPosition: Position,
  initialSize: Size,
  onResizeMove: (newPosition: Position, newSize: Size) => void,
  onResizeEnd: () => void,
  minSize: Size = { width: 50, height: 50 },
  maxSize: Size = { width: 800, height: 600 },
  bounds?: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  },
  enabled: boolean = true
) {
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    startX: 0,
    startY: 0,
    startPosition: initialPosition,
    startSize: initialSize,
    direction: 'se'
  });

  const handleMouseDown = useCallback((direction: ResizeDirection) => (event: React.MouseEvent) => {
    if (!enabled) return;
    
    event.preventDefault();
    event.stopPropagation(); // stopPropagation
    
    setResizeState({
      isResizing: true,
      startX: event.clientX,
      startY: event.clientY,
      startPosition: initialPosition,
      startSize: initialSize,
      direction
    });
  }, [enabled, initialPosition, initialSize]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!resizeState.isResizing) return;
    
    event.preventDefault();
    
    const deltaX = event.clientX - resizeState.startX;
    const deltaY = event.clientY - resizeState.startY;
    
    let newX = resizeState.startPosition.x;
    let newY = resizeState.startPosition.y;
    let newWidth = resizeState.startSize.width;
    let newHeight = resizeState.startSize.height;
    
    const { direction } = resizeState;
    
    if (direction.includes('e')) {
      newWidth = Math.max(minSize.width, Math.min(maxSize.width, resizeState.startSize.width + deltaX));
    }
    
    if (direction.includes('s')) {
      newHeight = Math.max(minSize.height, Math.min(maxSize.height, resizeState.startSize.height + deltaY));
    }
    
    if (direction.includes('w')) {
      const newRight = resizeState.startPosition.x + resizeState.startSize.width;
      newWidth = Math.max(minSize.width, Math.min(maxSize.width, resizeState.startSize.width - deltaX));
      newX = Math.min(newRight - minSize.width, resizeState.startPosition.x + deltaX);
    }
    
    if (direction.includes('n')) {
      const newBottom = resizeState.startPosition.y + resizeState.startSize.height;
      newHeight = Math.max(minSize.height, Math.min(maxSize.height, resizeState.startSize.height - deltaY));
      newY = Math.min(newBottom - minSize.height, resizeState.startPosition.y + deltaY);
    }
    
    if (bounds) {
      if (direction.includes('w')) {
        newX = Math.max(bounds.minX, newX);
      }
      if (direction.includes('n')) {
        newY = Math.max(bounds.minY, newY);
      }
      if (direction.includes('e')) {
        newWidth = Math.min(bounds.maxX - newX, newWidth);
      }
      if (direction.includes('s')) {
        newHeight = Math.min(bounds.maxY - newY, newHeight);
      }
      
      if (direction.includes('w') && newX === bounds.minX) {
        newWidth = resizeState.startPosition.x + resizeState.startSize.width - bounds.minX;
      }
      if (direction.includes('n') && newY === bounds.minY) {
        newHeight = resizeState.startPosition.y + resizeState.startSize.height - bounds.minY;
      }
    }
    
    return {
      position: { x: newX, y: newY },
      size: { width: newWidth, height: newHeight }
    };
  }, [resizeState, minSize, maxSize, bounds]);

  const handleMouseUp = useCallback((event?: MouseEvent) => {
    if (!resizeState.isResizing) return;
    
    if (event) {
      event.preventDefault();
      event.stopPropagation(); // stopPropagation
    }
    
    setResizeState(prev => ({ ...prev, isResizing: false }));
    onResizeEnd();
  }, [resizeState.isResizing, onResizeEnd]);

  useEffect(() => {
    if (resizeState.isResizing) {
      const handleGlobalMouseMove = (event: MouseEvent) => {
        const result = handleMouseMove(event);
        if (result) {
          onResizeMove(result.position, result.size);
        }
      };
      
      const handleGlobalMouseUp = (event: MouseEvent) => {
        handleMouseUp(event);
      };
      
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [resizeState.isResizing, handleMouseMove, handleMouseUp, onResizeMove]);

  return {
    handleMouseDown,
    isResizing: resizeState.isResizing
  };
}