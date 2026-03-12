import { type Presentation } from './types';

export const maximalPresentation: Presentation = {
  title: "Maximal Presentation with Long Descriptive Title",
  slides: [
    {
      id: "maximal-slide-1",
      background: { type: 'gradient', value: ['#FF0000', '#0000FF'] },
      elements: [
        {
          id: "maximal-text-1",
          type: 'text',
          content: "First maximal text element with long content",
          fontSize: 24,
          fontFamily: "Times New Roman",
          color: "#FF0000",
          position: { x: 50, y: 100 },
          size: { width: 200, height: 80 }
        },
        {
          id: "maximal-image-1",
          type: 'image',
          src: "first-image.png",
          position: { x: 100, y: 50 },
          size: { width: 300, height: 200 }
        }
      ]
    },
    {
      id: "maximal-slide-2",
      background: { type: 'image', value: 'first-image.png' },
      elements: [
        {
          id: "maximal-text-2",
          type: 'text',
          content: "Second maximal text element",
          fontSize: 18,
          fontFamily: "Verdana",
          color: "#0000FF",
          position: { x: 300, y: 200 },
          size: { width: 150, height: 60 }
        },
        {
          id: "maximal-image-2",
          type: 'image',
          src: "first-image.png",
          position: { x: 450, y: 150 },
          size: { width: 250, height: 180 }
        }
      ]
    },
    {
      id: "maximal-slide-3",
      background: { type: 'color', value: '#00FF00' },
      elements: [
        {
          id: "maximal-text-1",
          type: 'text',
          content: "First maximal text element with long content",
          fontSize: 24,
          fontFamily: "Times New Roman",
          color: "#FF0000",
          position: { x: 50, y: 100 },
          size: { width: 200, height: 80 }
        },
        {
          id: "maximal-image-2",
          type: 'image',
          src: "second-image.jpg",
          position: { x: 450, y: 150 },
          size: { width: 250, height: 180 }
        }
      ]
    }
  ],
  selection: {
    slides: ["maximal-slide-1", "maximal-slide-2"],
    elements: {
      slideId: "maximal-slide-1",
      elementIds: ["maximal-text-1", "maximal-image-1"]
    }
  }
};