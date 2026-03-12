import { type Presentation, type Slide } from '../../types';
import { arraysEqual } from './utils';

export const slideReducers = {
  addSlide: (state: Presentation, insertIndex?: number): Presentation => {
    const actualInsertIndex = insertIndex ?? state.slides.length;
    
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      background: { type: 'color', value: '#FFFFFF' },
      elements: []
    };

    const slides = [...state.slides];
    slides.splice(actualInsertIndex, 0, newSlide);
    
    return {
      ...state,
      slides,
      selection: {
        ...state.selection,
        slides: [newSlide.id]
      }
    };
  },

  removeSlide: (state: Presentation, slideId: string): Presentation => {
    const slides = state.slides.filter(slide => slide.id !== slideId);
    
    return {
      ...state,
      slides,
      selection: {
        ...state.selection,
        slides: slides.length > 0 ? [slides[0].id] : []
      }
    };
  },

  removeSlides: (state: Presentation, slideIds: string[]): Presentation => {
    const slides = state.slides.filter(slide => !slideIds.includes(slide.id));
    
    return {
      ...state,
      slides,
      selection: {
        ...state.selection,
        slides: slides.length > 0 ? [slides[0].id] : []
      }
    };
  },

  changeSlideOrder: (state: Presentation, fromIndex: number, toIndex: number): Presentation => {
    if (fromIndex === toIndex) return state;
    
    const slides = [...state.slides];
    const [movedSlide] = slides.splice(fromIndex, 1);
    slides.splice(toIndex, 0, movedSlide);
    
    return {
      ...state,
      slides
    };
  },

  moveSlides: (state: Presentation, slideIds: string[], insertBeforeIndex: number): Presentation => {
    if (slideIds.length === 0) return state;
    
    const slidesToMove = state.slides.filter(slide => slideIds.includes(slide.id));
    const remainingSlides = state.slides.filter(slide => !slideIds.includes(slide.id));
    
    const currentSlideIds = state.slides.map(s => s.id);
    const newSlideIds = [...remainingSlides];
    let correctInsertIndex = insertBeforeIndex;
    
    const movedSlidesBeforeIndex = slidesToMove.filter(slide => {
      const originalIndex = state.slides.findIndex(s => s.id === slide.id);
      return originalIndex < insertBeforeIndex;
    }).length;
    
    correctInsertIndex = insertBeforeIndex - movedSlidesBeforeIndex;
    newSlideIds.splice(correctInsertIndex, 0, ...slidesToMove);
    
    const newSlideIdsArray = newSlideIds.map(s => s.id);
    if (arraysEqual(currentSlideIds, newSlideIdsArray)) return state;
    
    return {
      ...state,
      slides: newSlideIds,
      selection: {
        ...state.selection,
        slides: slideIds
      }
    };
  },

  selectSlides: (state: Presentation, slideIds: string[]): Presentation => {
    const currentSlideIds = state.selection.slides;
    
    if (arraysEqual(currentSlideIds, slideIds) && !state.selection.elements) {
      return state;
    }
    
    return {
      ...state,
      selection: {
        slides: slideIds,
        elements: null
      }
    };
  }
};