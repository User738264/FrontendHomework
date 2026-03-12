import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { 
  type Presentation, 
  type NewElement, 
  type BackgroundChange, 
  type Position, 
  type Size,
  type GroupMove,
  type SlidesMove,
  type HistoryState
} from '../../types';
import { maximalPresentation } from '../../data';
import { slideReducers } from './slideReducers';
import { elementReducers } from './elementReducers';
import { backgroundReducers } from './backgroundReducers';
import { selectionReducers } from './selectionReducers';

const initialState: HistoryState = {
  past: [],
  present: maximalPresentation,
  future: []
};

const presentationSlice = createSlice({
  name: 'presentation',
  initialState,
  reducers: {
    // Main action for updating entire state (used by middleware)
    updateState: (state, action: PayloadAction<HistoryState>) => {
      return action.payload;
    },

    // Load presentation state (resets history)
    loadPresentationState: (state, action: PayloadAction<Presentation>) => {
      state.past = [];
      state.present = action.payload;
      state.future = [];
    },

    // Undo/redo actions (will be handled by middleware)
    undo: (state) => {
      // Stub - actual logic in middleware
      return state;
    },
    
    redo: (state) => {
      // Stub - actual logic in middleware
      return state;
    },
    
    clearHistory: (state) => {
      // Stub - actual logic in middleware
      return state;
    },

    // Change presentation title
    changePresentationTitle: (state, action: PayloadAction<string>) => {
      state.present.title = action.payload;
    },

    // Slide operations
    addSlide: (state, action: PayloadAction<{ insertAt?: number } | undefined>) => {
      const insertIndex = action.payload?.insertAt ?? state.present.slides.length;
      state.present = slideReducers.addSlide(state.present, insertIndex);
    },

    removeSlide: (state, action: PayloadAction<string>) => {
      state.present = slideReducers.removeSlide(state.present, action.payload);
    },

    removeSlides: (state, action: PayloadAction<string[]>) => {
      state.present = slideReducers.removeSlides(state.present, action.payload);
    },

    changeSlideOrder: (state, action: PayloadAction<{ fromIndex: number; toIndex: number }>) => {
      const { fromIndex, toIndex } = action.payload;
      state.present = slideReducers.changeSlideOrder(state.present, fromIndex, toIndex);
    },

    moveSlides: (state, action: PayloadAction<SlidesMove>) => {
      const { slideIds, insertBeforeIndex } = action.payload;
      state.present = slideReducers.moveSlides(state.present, slideIds, insertBeforeIndex);
    },

    selectSlides: (state, action: PayloadAction<string[]>) => {
      state.present = slideReducers.selectSlides(state.present, action.payload);
    },

    // Element operations
    addElement: (state, action: PayloadAction<{ slideId: string; element: NewElement }>) => {
      const { slideId, element } = action.payload;
      state.present = elementReducers.addElement(state.present, slideId, element);
    },

    removeElement: (state, action: PayloadAction<{ slideId: string; elementId: string }>) => {
      const { slideId, elementId } = action.payload;
      state.present = elementReducers.removeElement(state.present, slideId, elementId);
    },

    updateElementPositionWithoutHistory: (state, action: PayloadAction<{ slideId: string; elementId: string; newPosition: Position }>) => {
      const { slideId, elementId, newPosition } = action.payload;
      
      const slide = state.present.slides.find(s => s.id === slideId);
      if (slide) {
        const element = slide.elements.find(el => el.id === elementId);
        if (element) {
          element.position = newPosition;
        }
      }
    },

    commitElementPosition: (state, action: PayloadAction<{ slideId: string; elementId: string; initialPosition: Position; finalPosition: Position }>) => {
      const { slideId, elementId, initialPosition, finalPosition } = action.payload;
      state.present = elementReducers.commitElementPosition(
        state.present, 
        slideId, 
        elementId, 
        initialPosition, 
        finalPosition
      );
    },

    updateElementSizeWithoutHistory: (state, action: PayloadAction<{ slideId: string; elementId: string; newSize: Size; newPosition: Position }>) => {
      const { slideId, elementId, newSize, newPosition } = action.payload;
      
      const slide = state.present.slides.find(s => s.id === slideId);
      if (slide) {
        const element = slide.elements.find(el => el.id === elementId);
        if (element) {
          element.size = newSize;
          element.position = newPosition;
        }
      }
    },

    commitElementSize: (state, action: PayloadAction<{ slideId: string; elementId: string; initialSize: Size; finalSize: Size; initialPosition: Position; finalPosition: Position }>) => {
      const { slideId, elementId, initialSize, finalSize, initialPosition, finalPosition } = action.payload;
      state.present = elementReducers.commitElementSize(
        state.present, 
        slideId, 
        elementId, 
        initialSize, 
        finalSize, 
        initialPosition, 
        finalPosition
      );
    },

    updateTextContent: (state, action: PayloadAction<{ slideId: string; elementId: string; newContent: string }>) => {
      const { slideId, elementId, newContent } = action.payload;
      state.present = elementReducers.updateTextContent(state.present, slideId, elementId, newContent);
    },

    // Background operations
    changeSlideBackground: (state, action: PayloadAction<BackgroundChange>) => {
      const { slideId, background } = action.payload;
      state.present = backgroundReducers.changeSlideBackground(state.present, slideId, background);
    },

    // Element selection
    selectElements: (state, action: PayloadAction<{ slideId: string; elementIds: string[] }>) => {
      const { slideId, elementIds } = action.payload;
      state.present = selectionReducers.selectElements(state.present, slideId, elementIds);
    },

    updateGroupPositionWithoutHistory: (state, action: PayloadAction<GroupMove>) => {
      const { slideId, elementIds, delta } = action.payload;
      
      const slide = state.present.slides.find(s => s.id === slideId);
      if (slide) {
        slide.elements.forEach(element => {
          if (elementIds.includes(element.id)) {
            element.position.x += delta.x;
            element.position.y += delta.y;
          }
        });
      }
    },

    commitGroupPosition: (state, action: PayloadAction<GroupMove>) => {
      const { slideId, elementIds, delta } = action.payload;
      state.present = selectionReducers.updateGroupPosition(
        state.present, 
        slideId, 
        elementIds, 
        delta.x, 
        delta.y
      );
    },

    // Reset to default presentation
    resetToDefault: (state) => {
      state.past = [];
      state.present = maximalPresentation;
      state.future = [];
    },

    updateTextProperties: (
      state,
      action: PayloadAction<{
        slideId: string;
        elementId: string;
        updates: Partial<Pick<TextElement, 'fontSize' | 'fontFamily' | 'color'>>;
      }>
    ) => {
      const { slideId, elementId, updates } = action.payload;
      const slide = state.present.slides.find(s => s.id === slideId);
      if (!slide) return;

      const element = slide.elements.find(el => el.id === elementId);
      if (element?.type !== 'text') return;

      Object.assign(element, updates);
    },
  },
});

export const {
  updateState,
  loadPresentationState,
  undo,
  redo,
  clearHistory,
  changePresentationTitle,
  addSlide,
  removeSlide,
  removeSlides,
  changeSlideOrder,
  moveSlides,
  selectSlides,
  addElement,
  removeElement,
  updateElementPositionWithoutHistory,
  commitElementPosition,
  updateElementSizeWithoutHistory,
  commitElementSize,
  updateTextContent,
  changeSlideBackground,
  selectElements,
  updateGroupPositionWithoutHistory,
  commitGroupPosition,
  resetToDefault,
  updateTextProperties,
} = presentationSlice.actions;

export default presentationSlice.reducer;