import React, { useRef, useState, useEffect, useCallback } from 'react';
import { type Position } from '../types';
import TextElement from './TextElement';
import ImageElement from './ImageElement';
import { useGroupDragAndDrop } from '../hooks/useGroupDragAndDrop';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState } from '../store';
import { 
  updateGroupPositionWithoutHistory, 
  commitGroupPosition,
  selectElements
} from '../store/presentation';

const SlideCanvas: React.FC = () => {
  const dispatch = useDispatch();
  const slideCanvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 500 });
  
  // data from store
  const selectedSlideId = useSelector((state: RootState) => 
    state.presentation.present.selection.slides[0] || ''
  );
  
  const slide = useSelector((state: RootState) => 
    state.presentation.present.slides.find(s => s.id === selectedSlideId)
  );
  
  const selectedElementIds = useSelector((state: RootState) => {
    const elementsSelection = state.presentation.present.selection.elements;
    return (elementsSelection && elementsSelection.slideId === selectedSlideId) 
      ? elementsSelection.elementIds 
      : [];
  });
  
  const initialGroupPositionsRef = useRef<{ [elementId: string]: Position }>({});
  const accumulatedDeltaRef = useRef<Position>({ x: 0, y: 0 });

  useEffect(() => {
    const updateCanvasSize = () => {
      if (slideCanvasRef.current) {
        const rect = slideCanvasRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const getInitialGroupPositions = useCallback(() => {
    const positions: { [elementId: string]: Position } = {};
    selectedElementIds.forEach(elementId => {
      const element = slide?.elements.find(el => el.id === elementId);
      if (element) {
        positions[elementId] = { ...element.position };
      }
    });
    return positions;
  }, [slide, selectedElementIds]);

  const handleGroupDragMove = useCallback((newPositions: { [elementId: string]: Position }) => {
    const firstElementId = selectedElementIds[0];
    if (firstElementId) {
      const initialPos = initialGroupPositionsRef.current[firstElementId];
      const newPos = newPositions[firstElementId];
      
      if (initialPos && newPos) {
        const delta = {
          x: newPos.x - initialPos.x,
          y: newPos.y - initialPos.y
        };
        
        accumulatedDeltaRef.current = delta;
        
        dispatch(updateGroupPositionWithoutHistory({
          slideId: selectedSlideId,
          elementIds: selectedElementIds,
          delta
        }));
      }
    }
  }, [dispatch, selectedSlideId, selectedElementIds]);

  const handleGroupDragEnd = useCallback(() => {
    if (accumulatedDeltaRef.current.x !== 0 || accumulatedDeltaRef.current.y !== 0) {
      dispatch(commitGroupPosition({
        slideId: selectedSlideId,
        elementIds: selectedElementIds,
        delta: accumulatedDeltaRef.current
      }));
      accumulatedDeltaRef.current = { x: 0, y: 0 };
      initialGroupPositionsRef.current = {};
    }
  }, [dispatch, selectedSlideId, selectedElementIds, accumulatedDeltaRef, initialGroupPositionsRef]);

  const { handleMouseDown: handleGroupDragStart, isDragging: isGroupDragging } = useGroupDragAndDrop(
    selectedElementIds,
    getInitialGroupPositions(),
    handleGroupDragMove,
    handleGroupDragEnd,
    selectedElementIds.length > 1,
    {
      minX: 0,
      minY: 0,
      maxX: canvasSize.width,
      maxY: canvasSize.height
    }
  );

  useEffect(() => {
    if (selectedElementIds.length > 1) {
      initialGroupPositionsRef.current = getInitialGroupPositions();
    }
  }, [selectedElementIds, getInitialGroupPositions, initialGroupPositionsRef]);

  const getBackgroundStyle = () => {
    if (!slide) return {};
    
    if (slide.background.type === 'color') {
      return { background: slide.background.value };
    } else if (slide.background.type === 'gradient') {
      return { background: `linear-gradient(${slide.background.value.join(', ')})` };
    } else if (slide.background.type === 'image') {
      return { background: `url(${slide.background.value}) center/cover no-repeat` };
    }
    return {};
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (e.target === e.currentTarget) {
      dispatch(selectElements({ 
        slideId: selectedSlideId, 
        elementIds: [] 
      }));
    }
  };

  const handleElementGroupDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleGroupDragStart(e);
  };

  if (!slide) {
    return (
      <div 
        className="slide-canvas" 
        ref={slideCanvasRef}
        style={{ 
          width: '100%', 
          height: '500px', 
          position: 'relative',
          backgroundColor: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666'
        }}
      >
        Выберите слайд для редактирования
      </div>
    );
  }

  return (
    <div 
      className="slide-canvas" 
      ref={slideCanvasRef}
      style={{ 
        ...getBackgroundStyle(), 
        width: '90%', 
        height: '110%', 
        position: 'relative',
        cursor: isGroupDragging ? 'grabbing' : 'default'
      }}
      onClick={handleCanvasClick}
    >
      {slide.elements.map((element) => {
        const dragBounds = {
          minX: 0,
          minY: 0,
          maxX: canvasSize.width - element.size.width,
          maxY: canvasSize.height - element.size.height
        };

        const resizeBounds = {
          width: canvasSize.width - element.position.x,
          height: canvasSize.height - element.position.y
        };

        if (element.type === 'text') {
          return (
            <TextElement
              key={element.id}
              elementId={element.id}
              slideId={selectedSlideId}
              onGroupDragStart={handleElementGroupDragStart}
              dragBounds={dragBounds}
              resizeBounds={resizeBounds}
            />
          );
        } else if (element.type === 'image') {
          return (
            <ImageElement
              key={element.id}
              elementId={element.id}
              slideId={selectedSlideId}
              onGroupDragStart={handleElementGroupDragStart}
              dragBounds={dragBounds}
              resizeBounds={resizeBounds}
            />
          );
        }
        return null;
      })}
    </div>
  );
};

export default SlideCanvas;