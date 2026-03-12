import { useState, useEffect, useCallback } from 'react';
import { type Position } from '../types';

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function useDragAndDrop(
  initialPosition: Position,
  onDragMove: (newPosition: Position) => void,
  onDragEnd: () => void,
  enabled: boolean = true,
  bounds?: Bounds
) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    offsetX: initialPosition.x,
    offsetY: initialPosition.y
  });

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (!enabled) return;
    
    event.preventDefault();
    
    setDragState({
      isDragging: true,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: initialPosition.x,
      offsetY: initialPosition.y
    });
  }, [enabled, initialPosition]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!dragState.isDragging) return;
    
    event.preventDefault();
    
    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    
    let newX = dragState.offsetX + deltaX;
    let newY = dragState.offsetY + deltaY;

    if (bounds) {
      newX = Math.max(bounds.minX, Math.min(bounds.maxX, newX));
      newY = Math.max(bounds.minY, Math.min(bounds.maxY, newY));
    }
    
    return {
      x: newX,
      y: newY
    };
  }, [dragState, bounds]);

  const handleMouseUp = useCallback((event?: MouseEvent) => {
    if (!dragState.isDragging) return;
    
    if (event) {
      event.preventDefault();
    }
    
    setDragState(prev => ({ ...prev, isDragging: false }));
    onDragEnd();
  }, [dragState.isDragging, onDragEnd]);

  useEffect(() => {
    if (dragState.isDragging) {
      const handleGlobalMouseMove = (event: MouseEvent) => {
        const newPosition = handleMouseMove(event);
        if (newPosition) {
          onDragMove(newPosition);
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
  }, [dragState.isDragging, handleMouseMove, handleMouseUp, onDragMove]);

  return {
    handleMouseDown,
    isDragging: dragState.isDragging
  };
}