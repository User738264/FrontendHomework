import { type Presentation } from '../../types';

export type PresentationUpdate = {
  past: Presentation[];
  present: Presentation;
  future: Presentation[];
};