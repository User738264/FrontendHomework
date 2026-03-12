import { type Presentation, type NewElement, type Position, type Size } from '../../types';
import { positionsEqual, sizesEqual } from './utils';

export const elementReducers = {
  addElement: (state: Presentation, slideId: string, element: NewElement): Presentation => {
    const newElement = element.type === 'text' 
      ? {
          id: `element-${Date.now()}`,
          type: 'text' as const,
          content: element.content || 'Новый текст',
          fontSize: 16,
          fontFamily: 'Arial',
          color: '#000000',
          position: element.position,
          size: element.size
        }
      : {
          id: `element-${Date.now()}`,
          type: 'image' as const,
          src: element.src || '',
          position: element.position,
          size: element.size
        };

    const slides = state.slides.map(slide =>
      slide.id === slideId
        ? { ...slide, elements: [...slide.elements, newElement] }
        : slide
    );

    return {
      ...state,
      slides
    };
  },

  removeElement: (state: Presentation, slideId: string, elementId: string): Presentation => {
    const slide = state.slides.find(s => s.id === slideId);
    if (!slide) return state;
    
    const elementExists = slide.elements.some(el => el.id === elementId);
    if (!elementExists) return state;
    
    const slides = state.slides.map(slide =>
      slide.id === slideId
        ? { ...slide, elements: slide.elements.filter(el => el.id !== elementId) }
        : slide
    );

    return {
      ...state,
      slides,
      selection: {
        ...state.selection,
        elements: state.selection.elements?.slideId === slideId && 
                  state.selection.elements.elementIds.includes(elementId)
          ? {
              ...state.selection.elements,
              elementIds: state.selection.elements.elementIds.filter(id => id !== elementId)
            }
          : state.selection.elements
      }
    };
  },

  updateElementPosition: (state: Presentation, slideId: string, elementId: string, newPosition: Position): Presentation => {
    const slides = state.slides.map(slide =>
      slide.id === slideId
        ? {
            ...slide,
            elements: slide.elements.map(element =>
              element.id === elementId
                ? { ...element, position: newPosition }
                : element
            )
          }
        : slide
    );

    return {
      ...state,
      slides
    };
  },

  commitElementPosition: (state: Presentation, slideId: string, elementId: string, initialPosition: Position, finalPosition: Position): Presentation => {
    if (positionsEqual(initialPosition, finalPosition)) {
      return state;
    }
    
    return elementReducers.updateElementPosition(state, slideId, elementId, finalPosition);
  },

  updateElementSize: (state: Presentation, slideId: string, elementId: string, newSize: Size, newPosition: Position): Presentation => {
    const slides = state.slides.map(slide =>
      slide.id === slideId
        ? {
            ...slide,
            elements: slide.elements.map(element =>
              element.id === elementId
                ? { ...element, size: newSize, position: newPosition }
                : element
            )
          }
        : slide
    );

    return {
      ...state,
      slides
    };
  },

  commitElementSize: (state: Presentation, slideId: string, elementId: string, initialSize: Size, finalSize: Size, initialPosition: Position, finalPosition: Position): Presentation => {
    if (sizesEqual(initialSize, finalSize) && positionsEqual(initialPosition, finalPosition)) {
      return state;
    }
    
    return elementReducers.updateElementSize(state, slideId, elementId, finalSize, finalPosition);
  },

  updateTextContent: (state: Presentation, slideId: string, elementId: string, newContent: string): Presentation => {
    const slide = state.slides.find(s => s.id === slideId);
    if (!slide) return state;
    
    const element = slide.elements.find(el => el.id === elementId && el.type === 'text');
    if (!element || element.type !== 'text' || element.content === newContent) {
      return state;
    }
    
    const slides = state.slides.map(slide =>
      slide.id === slideId
        ? {
            ...slide,
            elements: slide.elements.map(element =>
              element.id === elementId && element.type === 'text'
                ? { ...element, content: newContent }
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