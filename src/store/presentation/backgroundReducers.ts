import { type Presentation, type SlideBackground } from '../../types';

export const backgroundReducers = {
  changeSlideBackground: (state: Presentation, slideId: string, background: SlideBackground): Presentation => {
    const slide = state.slides.find(s => s.id === slideId);
    if (!slide) return state;
    
    if (
      slide.background.type === background.type &&
      JSON.stringify(slide.background.value) === JSON.stringify(background.value)
    ) {
      return state;
    }
    
    const slides = state.slides.map(slide =>
      slide.id === slideId
        ? { ...slide, background }
        : slide
    );

    return {
      ...state,
      slides
    };
  }
};