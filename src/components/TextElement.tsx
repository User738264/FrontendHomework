import React, { useState, useRef, useCallback } from 'react';
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
  selectElements,
  updateTextContent
} from '../store/presentation';
import styles from './TextElement.module.css';

interface TextElementProps {
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

const TextElement: React.FC<TextElementProps> = ({ 
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
    return slide?.elements.find(el => el.id === elementId && el.type === 'text');
  });
  
  // Get selected element IDs for current slide
  const selectedElementIds = useSelector((state: RootState) => {
    const elementsSelection = state.presentation.present.selection.elements;
    return (elementsSelection && elementsSelection.slideId === slideId) 
      ? elementsSelection.elementIds 
      : [];
  });
  
  // State for text editing mode and edit buffer
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(element?.content || '');
  
  // Refs to track initial position/size for undo/redo commits
  const initialPositionRef = useRef<Position | null>(null);
  const initialSizeRef = useRef<Size | null>(null);
  const wasMovedRef = useRef(false);
  const wasResizedRef = useRef(false);

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
    !isEditing && !isPartOfGroup, // Disabled when editing or part of group
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
    { width: 30, height: 20 }, // Minimum size for text elements
    { width: resizeBounds.width, height: resizeBounds.height }, // Maximum size based on canvas
    {
      minX: 0,
      minY: 0,
      maxX: dragBounds.maxX + (elementSize.width || 0),
      maxY: dragBounds.maxY + (elementSize.height || 0)
    },
    !isEditing && !isPartOfGroup // Disabled when editing or part of group
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
  // Routes to group drag or individual drag based on selection and edit state
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0 && !isEditing) { // Left mouse button and not in edit mode
      if (isPartOfGroup) {
        e.preventDefault();
        onGroupDragStart(e);
      } else {
        handleDragMouseDown(e);
        handleElementClick(e);
      }
    }
  }, [isEditing, isPartOfGroup, onGroupDragStart, handleDragMouseDown, handleElementClick]);

  // Don't render if element doesn't exist (e.g., was deleted)
  if (!element) {
    return null;
  }

  const isSelected = selectedElementIds.includes(elementId);
  const borderWidth = 2;

  // Handle double-click to enter edit mode
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsEditing(true);
    setEditContent(element.content);
  };

  // Handle blur (focus loss) to exit edit mode and save changes
  const handleBlur = () => {
    setIsEditing(false);
    if (editContent !== element.content) {
      dispatch(updateTextContent({
        slideId,
        elementId: element.id,
        newContent: editContent
      }));
    }
  };

  // Handle keyboard shortcuts in edit mode (Ctrl+Enter to save)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.code === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleBlur();
    }
  };

  return (
    <div
      className="text-element"
      style={{
        position: 'absolute',
        left: `${element.position.x}px`,
        top: `${element.position.y}px`,
        width: `${element.size.width}px`,
        height: `${element.size.height}px`,
        fontSize: `${element.fontSize}px`,
        fontFamily: element.fontFamily,
        color: element.color,
        backgroundColor: 'transparent',
        border: isSelected || isPartOfGroup ? `${borderWidth}px solid #007bff` : '1px solid #333',
        boxShadow: isSelected || isPartOfGroup ? '0 0 5px rgba(0, 123, 255, 0.5)' : 'none',
        cursor: isDragging ? 'grabbing' : (isResizing ? 'grabbing' : (isEditing ? 'text' : (isPartOfGroup ? 'move' : 'grab'))),
        zIndex: (isDragging || isResizing) ? 1000 : ((isSelected || isPartOfGroup) ? 100 : 1),
        userSelect: 'none',
        overflow: 'hidden',
        padding: '5px',
        opacity: isPartOfGroup && !isSelected ? 0.9 : 1,
        whiteSpace: 'pre-wrap', 
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            outline: 'none',
            resize: 'none',
            background: 'transparent',
            fontFamily: element.fontFamily,
            fontSize: `${element.fontSize}px`,
            color: element.color
          }}
          autoFocus
        />
      ) : (
        <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
          {element.content}
        </div>
      )}
      
      {/* Resize handles - only shown when selected, not editing, and not part of a group */}
      {isSelected && !isEditing && !isPartOfGroup && (
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

export default TextElement;