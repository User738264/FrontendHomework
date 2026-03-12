import { useState, useEffect, useCallback } from 'react';
import { type Slide } from '../types';

interface SlideDragState {
  isDragging: boolean;
  startIndex: number | null;
  currentIndex: number | null;
  selectedSlideIds: string[];
}

export function useSlideDragAndDrop(
  slides: Slide[],
  selectedSlideIds: string[],
  onSlidesReorder: (selectedSlideIds: string[], targetIndex: number) => void
) {
  const [dragState, setDragState] = useState<SlideDragState>({
    isDragging: false,
    startIndex: null,
    currentIndex: null,
    selectedSlideIds: []
  });

  const handleMouseDown = useCallback((index: number, event: React.MouseEvent) => {
    event.preventDefault();

    const slideId = slides[index].id;
    const isSelected = selectedSlideIds.includes(slideId);

    setDragState({
      isDragging: true,
      startIndex: index,
      currentIndex: index,
      selectedSlideIds: isSelected ? selectedSlideIds : [slideId]
    });
  }, [slides, selectedSlideIds]);

  const handleMouseMove = useCallback((
    index: number,
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (!dragState.isDragging) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const y = event.clientY - rect.top;
    const halfHeight = rect.height / 2;

    const newIndex = y > halfHeight ? index + 1 : index;

    const selectedIndices = dragState.selectedSlideIds
      .map(id => slides.findIndex(s => s.id === id))
      .filter(i => i !== -1)
      .sort((a, b) => a - b);

    if (selectedIndices.length > 0) {
      const minIdx = selectedIndices[0];
      const maxIdx = selectedIndices[selectedIndices.length - 1];
      if (newIndex > minIdx && newIndex < maxIdx + 1) {
        return;
      }
    }

    if (dragState.currentIndex !== newIndex) {
      setDragState(prev => ({
        ...prev,
        currentIndex: newIndex
      }));
    }
  }, [dragState.isDragging, dragState.currentIndex, dragState.selectedSlideIds, slides]);

  const handleMouseUp = useCallback(() => {
    if (
      dragState.isDragging &&
      dragState.startIndex !== null &&
      dragState.currentIndex !== null
    ) {
      const selectedIndices = dragState.selectedSlideIds
        .map(id => slides.findIndex(s => s.id === id))
        .filter(i => i !== -1)
        .sort((a, b) => a - b);

      const minIdx = selectedIndices.length > 0 ? selectedIndices[0] : dragState.startIndex;
      const maxIdx = selectedIndices.length > 0 ? selectedIndices[selectedIndices.length - 1] : dragState.startIndex;

      const target = dragState.currentIndex;
      if (target < minIdx || target > maxIdx + 1) {
        onSlidesReorder(dragState.selectedSlideIds, target);
      }
    }

    setDragState({
      isDragging: false,
      startIndex: null,
      currentIndex: null,
      selectedSlideIds: []
    });
  }, [dragState, onSlidesReorder, slides]);

  useEffect(() => {
    if (dragState.isDragging) {
      const handleGlobalMouseUp = () => {
        handleMouseUp();
      };

      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseUp]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    isDragging: dragState.isDragging,
    dragStartIndex: dragState.startIndex,
    dragCurrentIndex: dragState.currentIndex,
    dragSelectedIds: dragState.selectedSlideIds 
  };
}