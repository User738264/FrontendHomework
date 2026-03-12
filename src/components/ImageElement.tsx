import React, { useState, useRef, useCallback, useEffect } from 'react';
import { type Position, type Size } from '../types';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { useResize } from '../hooks/useResize';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState } from '../store';
import { 
  updateElementPositionWithoutHistory, 
  commitElementPosition,
  updateElementSizeWithoutHistory,
  commitElementSize,
  selectElements
} from '../store/presentation';
import styles from './ImageElement.module.css';

interface ImageElementProps {
  elementId: string;
  slideId: string;
  dragBounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  resizeBounds: {
    width: number;
    height: number;
  };
  onGroupDragStart: (event: React.MouseEvent) => void;
}

const ImageElement: React.FC<ImageElementProps> = ({ 
  elementId,
  slideId,
  onGroupDragStart,
  dragBounds,
  resizeBounds
}) => {
  const dispatch = useDispatch();
  
  // Get element data from Redux store
  const element = useSelector((state: RootState) => {
    const slide = state.presentation.present.slides.find(s => s.id === slideId);
    return slide?.elements.find(el => el.id === elementId && el.type === 'image');
  });
  
  // Get selected element IDs for current slide
  const selectedElementIds = useSelector((state: RootState) => {
    const elementsSelection = state.presentation.present.selection.elements;
    return (elementsSelection && elementsSelection.slideId === slideId) 
      ? elementsSelection.elementIds 
      : [];
  });
  
  // State for image loading and error handling
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Refs to track initial position/size for undo/redo commits
  const initialPositionRef = useRef<Position | null>(null);
  const initialSizeRef = useRef<Size | null>(null);
  const wasMovedRef = useRef(false);
  const wasResizedRef = useRef(false);

  // Update image URL when element source changes
  // Called on component mount and when element.src changes
  useEffect(() => {
    if (element?.src) {
      setImageUrl(element.src);
      setIsLoading(true);
      setImageError(false);
      console.log('ImageElement: URL updated to:', element.src);
    }
  }, [element?.src]);

  // Handle image loading error
  // If view URL fails, try download URL
  const handleImageError = useCallback(() => {
    if (!element?.src) return;
    
    console.error('Failed to load image:', element.src);
    setImageError(true);
    setIsLoading(false);
    
    if (element.src.includes('/view?')) {
      const downloadUrl = element.src.replace('/view?', '/download?');
      console.log('Trying download URL:', downloadUrl);
      setImageUrl(downloadUrl);
      setImageError(false);
      setIsLoading(true);
    }
  }, [element?.src]);

  // Handle successful image load
  const handleImageLoad = useCallback(() => {
    if (!element?.src) return;
    
    console.log('Image loaded successfully:', element.src);
    setImageError(false);
    setIsLoading(false);
  }, [element?.src]);

  // Callback when drag operation ends
  // Commits position change to history if element was actually moved
  const handleDragEnd = useCallback(() => {
    if (!element?.id) return;
    
    if (initialPositionRef.current && wasMovedRef.current) {
      dispatch(commitElementPosition({
        slideId,
        elementId: element.id,
        initialPosition: initialPositionRef.current,
        finalPosition: element.position
      }));
    }
    initialPositionRef.current = null;
    wasMovedRef.current = false;
  }, [dispatch, slideId, element?.id, element?.position]);

  // Callback during drag operation
  // Updates position without adding to history (batched for performance)
  const handleDragUpdate = useCallback((newPosition: Position) => {
    if (!element?.id) return;
    
    // Store initial position on first drag update
    if (!initialPositionRef.current) {
      initialPositionRef.current = { ...element.position };
    }
    dispatch(updateElementPositionWithoutHistory({
      slideId,
      elementId: element.id,
      newPosition
    }));
    wasMovedRef.current = true;
  }, [dispatch, slideId, element?.id, element?.position]);

  // Use fallback values to avoid conditional hook calls
  const elementPosition = element?.position || { x: 0, y: 0 };
  const elementSize = element?.size || { width: 0, height: 0 };
  const isPartOfGroup = element ? selectedElementIds.length > 1 && selectedElementIds.includes(elementId) : false;

  // Hook for drag and drop functionality
  // Parameters: initial position, update callback, end callback, enabled flag, drag boundaries
  const { handleMouseDown: handleDragMouseDown, isDragging } = useDragAndDrop(
    elementPosition,
    handleDragUpdate,
    handleDragEnd,
    !isPartOfGroup, // Disabled when part of group (handled by group drag)
    dragBounds
  );

  // Callback when resize operation ends
  // Commits size and position changes to history
  const handleResizeEnd = useCallback(() => {
    if (!element?.id) return;
    
    if (initialPositionRef.current && initialSizeRef.current && wasResizedRef.current) {
      dispatch(commitElementSize({
        slideId,
        elementId: element.id,
        initialSize: initialSizeRef.current,
        finalSize: element.size,
        initialPosition: initialPositionRef.current,
        finalPosition: element.position
      }));
    }
    initialPositionRef.current = null;
    initialSizeRef.current = null;
    wasResizedRef.current = false;
  }, [dispatch, slideId, element?.id, element?.size, element?.position]);

  // Callback during resize operation
  // Updates size and position without adding to history
  const handleResizeUpdate = useCallback((newPosition: Position, newSize: Size) => {
    if (!element?.id) return;
    
    // Store initial position and size on first resize update
    if (!initialPositionRef.current || !initialSizeRef.current) {
      initialPositionRef.current = { ...element.position };
      initialSizeRef.current = { ...element.size };
    }
    dispatch(updateElementSizeWithoutHistory({
      slideId,
      elementId: element.id,
      newSize,
      newPosition
    }));
    wasResizedRef.current = true;
  }, [dispatch, slideId, element?.id, element?.position, element?.size]);

  // Hook for resize functionality
  // Parameters: initial position, initial size, update callback, end callback, min/max sizes, boundaries, enabled flag
  const { handleMouseDown: handleResizeMouseDown, isResizing } = useResize(
    elementPosition,
    elementSize,
    handleResizeUpdate,
    handleResizeEnd,
    { width: 30, height: 30 }, // Minimum size
    { width: resizeBounds.width, height: resizeBounds.height }, // Maximum size based on canvas
    {
      minX: 0,
      minY: 0,
      maxX: dragBounds.maxX + (elementSize.width || 0),
      maxY: dragBounds.maxY + (elementSize.height || 0)
    },
    !isPartOfGroup // Disabled when part of group
  );

  // Handle element click for selection
  // Supports Ctrl/Cmd for multi-select and Shift for range select
  const handleElementClick = useCallback((e: React.MouseEvent) => {
    let newSelectedIds: string[];
    
    if (e.ctrlKey || e.metaKey) {
      // Toggle selection with Ctrl/Cmd
      if (selectedElementIds.includes(elementId)) {
        newSelectedIds = selectedElementIds.filter(id => id !== elementId);
      } else {
        newSelectedIds = [...selectedElementIds, elementId];
      }
    } else if (e.shiftKey && selectedElementIds.length > 0) {
      // Add to selection with Shift (basic implementation)
      newSelectedIds = selectedElementIds.includes(elementId) ? 
        selectedElementIds.filter(id => id !== elementId) : 
        [...selectedElementIds, elementId];
    } else {
      // Single selection
      newSelectedIds = [elementId];
    }
    
    dispatch(selectElements({ 
      slideId, 
      elementIds: newSelectedIds 
    }));
  }, [dispatch, slideId, elementId, selectedElementIds]);

  // Handle mouse down event
  // Routes to group drag or individual drag based on selection state
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button only
      if (isPartOfGroup) {
        e.preventDefault();
        onGroupDragStart(e);
      } else {
        handleDragMouseDown(e);
        handleElementClick(e);
      }
    }
  }, [isPartOfGroup, onGroupDragStart, handleDragMouseDown, handleElementClick]);

  // Don't render if element doesn't exist (e.g., was deleted)
  if (!element) {
    return null;
  }

  const isSelected = selectedElementIds.includes(elementId);
  const borderWidth = 2;

  return (
    <div
      className="image-element"
      style={{
        position: 'absolute',
        left: `${element.position.x}px`,
        top: `${element.position.y}px`,
        width: `${element.size.width}px`,
        height: `${element.size.height}px`,
        backgroundColor: '#f0f0f0',
        border: isSelected || isPartOfGroup ? `${borderWidth}px solid #007bff` : '1px solid #333',
        boxShadow: isSelected || isPartOfGroup ? '0 0 5px rgba(0, 123, 255, 0.5)' : 'none',
        backgroundImage: !imageError && imageUrl && !isLoading ? `url(${imageUrl})` : 'none',
        backgroundSize: '100% 100%',
        backgroundPosition: 'left top',
        backgroundRepeat: 'no-repeat',
        cursor: isDragging ? 'grabbing' : (isResizing ? 'grabbing' : (isPartOfGroup ? 'move' : 'grab')),
        zIndex: (isDragging || isResizing) ? 1000 : ((isSelected || isPartOfGroup) ? 100 : 1),
        userSelect: 'none',
        opacity: isPartOfGroup && !isSelected ? 0.9 : 1
      }}
      onMouseDown={handleMouseDown}
    >
      {isLoading && !imageError && (
        <div className={styles['loading-container']}>
          <div className={styles['loading-text']}>
            Loading image...
          </div>
        </div>
      )}
      
      {imageError && (
        <div className={styles['image-error']}>
          <div className={styles['error-message']}>⚠️ Image load error</div>
          <div className={styles['error-url']}>
            URL: {element.src.substring(0, 80)}...
          </div>
          <button 
            onClick={(e) => {
              e.preventDefault();
              window.open(element.src, '_blank');
            }}
            className={styles['open-url-button']}
          >
            Open URL
          </button>
        </div>
      )}
      
      {/* Hidden img element for actual loading and error handling */}
      <img
        src={imageUrl}
        alt=""
        style={{ display: 'none' }}
        onError={handleImageError}
        onLoad={handleImageLoad}
        crossOrigin="anonymous"
      />
      
      {/* Resize handles - only shown when selected and not part of a group */}
      {isSelected && !isPartOfGroup && !imageError && !isLoading && (
        <>
          <div
            onMouseDown={handleResizeMouseDown('nw')}
            className={`${styles['resize-handle']} ${styles['resize-handle-nw']}`}
          />
          
          <div
            onMouseDown={handleResizeMouseDown('n')}
            className={`${styles['resize-handle']} ${styles['resize-handle-n']}`}
          />
          
          <div
            onMouseDown={handleResizeMouseDown('ne')}
            className={`${styles['resize-handle']} ${styles['resize-handle-ne']}`}
          />
          
          <div
            onMouseDown={handleResizeMouseDown('e')}
            className={`${styles['resize-handle']} ${styles['resize-handle-e']}`}
          />
          
          <div
            onMouseDown={handleResizeMouseDown('se')}
            className={`${styles['resize-handle']} ${styles['resize-handle-se']}`}
          />
          
          <div
            onMouseDown={handleResizeMouseDown('s')}
            className={`${styles['resize-handle']} ${styles['resize-handle-s']}`}
          />
          
          <div
            onMouseDown={handleResizeMouseDown('sw')}
            className={`${styles['resize-handle']} ${styles['resize-handle-sw']}`}
          />
          
          <div
            onMouseDown={handleResizeMouseDown('w')}
            className={`${styles['resize-handle']} ${styles['resize-handle-w']}`}
          />
        </>
      )}
    </div>
  );
};

export default ImageElement;