import { useState, useEffect, useCallback } from 'react';
import { type Position } from '../types';

interface GroupDragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  initialPositions: { [elementId: string]: Position };
}

export function useGroupDragAndDrop(
  elementIds: string[],
  initialPositions: { [elementId: string]: Position },
  onGroupDragMove: (newPositions: { [elementId: string]: Position }) => void,
  onGroupDragEnd: () => void,
  enabled: boolean = true,
  bounds?: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  }
) {
  const [dragState, setDragState] = useState<GroupDragState | null>(null);
  const wasMovedRef = useRef(false);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (!enabled || elementIds.length === 0) return;
    
    event.preventDefault();
    
    setDragState({
      isDragging: true,
      startX: event.clientX,
      startY: event.clientY,
      initialPositions: { ...initialPositions }
    });
    wasMovedRef.current = false;
  }, [enabled, elementIds.length, initialPositions]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!dragState?.isDragging) return;
    
    event.preventDefault();
    
    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    
    // ignore movement if it to small
    if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;
    
    wasMovedRef.current = true;
    
    const newPositions: { [elementId: string]: Position } = {};
    
    Object.entries(dragState.initialPositions).forEach(([elementId, initialPos]) => {
      let newX = initialPos.x + deltaX;
      let newY = initialPos.y + deltaY;

      if (bounds) {
        newX = Math.max(bounds.minX, Math.min(bounds.maxX, newX));
        newY = Math.max(bounds.minY, Math.min(bounds.maxY, newY));
      }
      
      newPositions[elementId] = { x: newX, y: newY };
    });
    
    onGroupDragMove(newPositions);
  }, [dragState, bounds, onGroupDragMove]);

  const handleMouseUp = useCallback((event?: MouseEvent) => {
    if (event) {
      event.preventDefault();
    }
    
    setDragState(null);
    if (wasMovedRef.current) {
      onGroupDragEnd();
    }
    wasMovedRef.current = false;
  }, [onGroupDragEnd]);

  useEffect(() => {
    if (dragState?.isDragging) {
      const handleGlobalMouseMove = (event: MouseEvent) => {
        handleMouseMove(event);
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
  }, [dragState?.isDragging, handleMouseMove, handleMouseUp]);

  return {
    handleMouseDown,
    isDragging: dragState?.isDragging || false
  };
}

import { useRef } from 'react';