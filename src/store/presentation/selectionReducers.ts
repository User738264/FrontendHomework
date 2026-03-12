import { type Presentation } from '../../types';
import { arraysEqual } from './utils';

export const selectionReducers = {
  selectElements: (state: Presentation, slideId: string, elementIds: string[]): Presentation => {
    const currentSelection = state.selection.elements;
    const newSelection = elementIds.length > 0 
      ? { slideId, elementIds }
      : null;
    
    if (
      currentSelection?.slideId === slideId &&
      arraysEqual(currentSelection.elementIds, elementIds)
    ) {
      return state;
    }
    
    return {
      ...state,
      selection: {
        ...state.selection,
        elements: newSelection
      }
    };
  },

  updateGroupPosition: (state: Presentation, slideId: string, elementIds: string[], deltaX: number, deltaY: number): Presentation => {
    if (deltaX === 0 && deltaY === 0) return state;
    
    const slides = state.slides.map(slide =>
      slide.id === slideId
        ? {
            ...slide,
            elements: slide.elements.map(element =>
              elementIds.includes(element.id)
                ? { 
                    ...element, 
                    position: {
                      x: element.position.x + deltaX,
                      y: element.position.y + deltaY
                    }
                  }
                : element
            )
          }
        : slide
    );

    return {
      ...state,
      slides
    };
  }
};