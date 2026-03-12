import React, { useCallback, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { type RootState } from '../store';
import { selectSlides, moveSlides } from '../store/presentation';
import { useSlideDragAndDrop } from '../hooks/useSlideDragAndDrop';

const SlidesList: React.FC = () => {
  const dispatch = useDispatch();
  const slides = useSelector((state: RootState) => state.presentation.present.slides);
  const selectedSlideIds = useSelector((state: RootState) => state.presentation.present.selection.slides);

  const slidesListRef = useRef<HTMLDivElement>(null);

  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    isDragging,
    dragCurrentIndex,
    dragSelectedIds
  } = useSlideDragAndDrop(
    slides,
    selectedSlideIds,
    (selectedIds, targetIndex) => {
      dispatch(moveSlides({ slideIds: selectedIds, insertBeforeIndex: targetIndex }));
    }
  );

  useEffect(() => {
    if (selectedSlideIds.length > 0 && slidesListRef.current) {
      const selectedIndex = slides.findIndex(slide => slide.id === selectedSlideIds[0]);
      if (selectedIndex >= 0) {
        const slideElements = slidesListRef.current.children;
        if (slideElements.length > selectedIndex) {
          const slideElement = slideElements[selectedIndex] as HTMLElement;
          slideElement.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          });
        }
      }
    }
  }, [selectedSlideIds, slides]);

  const handleSlideClick = useCallback((slideId: string, event: React.MouseEvent) => {
    let newSelectedIds: string[];

    if (event.ctrlKey || event.metaKey) {
      if (selectedSlideIds.includes(slideId)) {
        newSelectedIds = selectedSlideIds.filter(id => id !== slideId);
      } else {
        newSelectedIds = [...selectedSlideIds, slideId];
      }
    } else if (event.shiftKey && selectedSlideIds.length > 0) {
      const lastSelectedIndex = slides.findIndex(s => s.id === selectedSlideIds[selectedSlideIds.length - 1]);
      const clickedIndex = slides.findIndex(s => s.id === slideId);
      const start = Math.min(lastSelectedIndex, clickedIndex);
      const end = Math.max(lastSelectedIndex, clickedIndex);
      newSelectedIds = slides.slice(start, end + 1).map(s => s.id);
    } else {
      newSelectedIds = [slideId];
    }

    dispatch(selectSlides(newSelectedIds));
  }, [slides, selectedSlideIds, dispatch]);

  return (
    <div 
      className="slides-list" 
      ref={slidesListRef} 
      style={{ 
        width: '200px', 
        overflowY: 'auto', 
        border: '1px solid #ccc',
        position: 'relative'
      }}
    >
      <div style={{ padding: '10px 0' }}>
        {slides.map((slide, index) => {
          const isSelected = selectedSlideIds.includes(slide.id);

          const showTopLine = isDragging && dragCurrentIndex === index && !dragSelectedIds.includes(slide.id);
          const showBottomLine = isDragging && dragCurrentIndex === index + 1 && !dragSelectedIds.includes(slide.id);

          return (
            <div
              key={slide.id}
              className={`slide-item ${isSelected ? 'selected' : ''}`}
              onClick={(e) => handleSlideClick(slide.id, e)}
              onMouseDown={(e) => handleMouseDown(index, e)}
              onMouseMove={(e) => handleMouseMove(index, e)}
              onMouseUp={handleMouseUp}
              style={{
                position: 'relative',
                padding: '8px',
                margin: '4px 8px',
                backgroundColor: isSelected ? '#e3f2fd' : '#fff',
                border: `2px solid ${isSelected ? '#2196f3' : '#ddd'}`,
                borderRadius: '4px',
                cursor: 'pointer',
                opacity: isDragging && dragSelectedIds.includes(slide.id) ? 0.5 : 1
              }}
            >
              {showTopLine && (
                <div
                  style={{
                    position: 'absolute',
                    top: -2,
                    left: 0,
                    right: 0,
                    height: '4px',
                    backgroundColor: '#007bff',
                    zIndex: 20,
                    borderRadius: '2px'
                  }}
                />
              )}

              {showBottomLine && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    left: 0,
                    right: 0,
                    height: '4px',
                    backgroundColor: '#007bff',
                    zIndex: 20,
                    borderRadius: '2px'
                  }}
                />
              )}

              <div 
                className="slide-preview"
                style={{
                  width: '100%',
                  height: '80px',
                  marginBottom: '3px',
                  position: 'relative',
                  overflow: 'hidden',
                  background: slide.background.type === 'color' ? slide.background.value :
                            slide.background.type === 'gradient' ? `linear-gradient(${slide.background.value.join(', ')})` :
                            `url(${slide.background.value}) center/cover no-repeat`,
                  border: '1px solid #ccc'
                }}
              >
                {slide.elements.map((element, elIndex) => (
                  <div
                    key={elIndex}
                    style={{
                      position: 'absolute',
                      left: `${element.position.x / 8}px`,
                      top: `${element.position.y / 8}px`,
                      width: `${element.size.width / 8}px`,
                      height: `${element.size.height / 8}px`,
                      backgroundColor: element.type === 'text' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(221, 221, 221, 0.8)',
                      border: element.type === 'text' ? '1px solid #ccc' : '1px dashed #999',
                    }}
                  />
                ))}
              </div>
              <div className="slide-number">
                Слайд {index + 1}
                {isSelected && selectedSlideIds.length > 1 && (
                  <span style={{ fontSize: '10px', color: '#666', marginLeft: '5px' }}>
                    ({selectedSlideIds.findIndex(id => id === slide.id) + 1}/{selectedSlideIds.length})
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SlidesList;