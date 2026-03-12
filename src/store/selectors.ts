import { type RootState } from './index';
import { type TextElement, type ImageElement } from '../types';

export const selectElementById = (
  state: RootState, 
  slideId: string, 
  elementId: string
) => {
  const slide = state.presentation.present.slides.find(s => s.id === slideId);
  if (!slide) return null;
  
  const element = slide.elements.find(el => el.id === elementId);
  if (!element) return null;
  
  return element;
};

export const selectTextElement = (
  state: RootState, 
  slideId: string, 
  elementId: string
): TextElement | null => {
  const element = selectElementById(state, slideId, elementId);
  if (!element || element.type !== 'text') return null;
  
  return element as TextElement;
};

export const selectImageElement = (
  state: RootState, 
  slideId: string, 
  elementId: string
): ImageElement | null => {
  const element = selectElementById(state, slideId, elementId);
  if (!element || element.type !== 'image') return null;
  
  return element as ImageElement;
};

export const selectSelectedElementIds = (state: RootState, slideId: string) => {
  const elementsSelection = state.presentation.present.selection.elements;
  return (elementsSelection && elementsSelection.slideId === slideId) 
    ? elementsSelection.elementIds 
    : [];
};

export const selectSlide = (state: RootState, slideId: string) => {
  return state.presentation.present.slides.find(s => s.id === slideId);
};