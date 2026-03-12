export type Position = {
  x: number;
  y: number;
};

export type Size = {
  width: number;
  height: number;
};

export type BaseElement = {
  id: string;
  position: Position;
  size: Size;
};

export type TextElement = BaseElement & {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
};

export type ImageElement = BaseElement & {
  type: 'image';
  src: string;
};

export type SlideElement = TextElement | ImageElement;

export type SlideBackground = 
  | { type: 'color'; value: string }
  | { type: 'image'; value: string }
  | { type: 'gradient'; value: string[] };

export type Slide = {
  id: string;
  background: SlideBackground;
  elements: SlideElement[];
};

export type ElementSelection = {
  slideId: string;
  elementIds: string[];
};

export type PresentationSelection = {
  slides: string[];
  elements: ElementSelection | null;
};

export type Presentation = {
  title: string;
  slides: Slide[];
  selection: PresentationSelection;
};

export type NewElement = {
  type: 'text' | 'image';
  content?: string;
  src?: string;
  position: Position;
  size: Size;
};

export type BackgroundChange = {
  slideId: string;
  background: SlideBackground;
};

export type GroupMove = {
  slideId: string;
  elementIds: string[];
  delta: Position;
};

export type SlidesMove = {
  slideIds: string[];
  insertBeforeIndex: number;
};

export type ResizeDirection = 
  | 'n'
  | 's'
  | 'e'
  | 'w'
  | 'ne'
  | 'nw'
  | 'se'
  | 'sw';

export type HistoryState = {
  past: Presentation[];
  present: Presentation;
  future: Presentation[];
};