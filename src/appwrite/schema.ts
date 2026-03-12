import Ajv from 'ajv';
import { type Presentation } from '../types';

const ajv = new Ajv();

export const presentationSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    slides: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          background: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['color', 'image', 'gradient'] },
              value: { 
                oneOf: [
                  { type: 'string' },
                  { type: 'array', items: { type: 'string' } }
                ]
              }
            },
            required: ['type', 'value']
          },
          elements: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                type: { type: 'string', enum: ['text', 'image'] },
                position: {
                  type: 'object',
                  properties: {
                    x: { type: 'number' },
                    y: { type: 'number' }
                  },
                  required: ['x', 'y']
                },
                size: {
                  type: 'object',
                  properties: {
                    width: { type: 'number' },
                    height: { type: 'number' }
                  },
                  required: ['width', 'height']
                }
              },
              required: ['id', 'type', 'position', 'size'],
              if: {
                properties: { type: { const: 'text' } }
              },
              then: {
                properties: {
                  content: { type: 'string' },
                  fontSize: { type: 'number' },
                  fontFamily: { type: 'string' },
                  color: { type: 'string' }
                },
                required: ['content', 'fontSize', 'fontFamily', 'color']
              },
              else: {
                properties: {
                  src: { type: 'string' }
                },
                required: ['src']
              }
            }
          }
        },
        required: ['id', 'background', 'elements']
      }
    },
    selection: {
      type: 'object',
      properties: {
        slides: { type: 'array', items: { type: 'string' } },
        elements: {
          type: ['object', 'null'],
          properties: {
            slideId: { type: 'string' },
            elementIds: { type: 'array', items: { type: 'string' } }
          },
          required: ['slideId', 'elementIds']
        }
      },
      required: ['slides']
    }
  },
  required: ['title', 'slides', 'selection']
};

export const validatePresentation = (data: unknown): { valid: boolean; errors?: string[] } => {
  try {
    const validate = ajv.compile(presentationSchema);
    const valid = validate(data);
    
    if (!valid) {
      return {
        valid: false,
        errors: validate.errors?.map(error => `${error.instancePath} ${error.message}`)
      };
    }
    
    return { valid: true };
  } catch (error) {
    console.error('Validation error:', error);
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : 'Unknown validation error']
    };
  }
};

export const safeParsePresentation = (data: unknown): Presentation | null => {
  try {
    console.log('safeParsePresentation input:', typeof data, data);
    
    let parsed: unknown;
    
    if (typeof data === 'object' && data !== null) {
      parsed = data;
    } 
    else if (typeof data === 'string') {
      try {
        parsed = JSON.parse(data);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return null;
      }
    }
    else {
      console.error('Invalid data type:', typeof data);
      return null;
    }
    
    const validation = validatePresentation(parsed);
    
    if (!validation.valid) {
      console.error('Presentation validation failed:', validation.errors);
      console.error('Invalid data:', parsed);
      return null;
    }
    
    const presentation = parsed as Presentation;
    
    if (!presentation.title) presentation.title = 'Без названия';
    if (!presentation.slides) presentation.slides = [];
    if (!presentation.selection) {
      presentation.selection = {
        slides: [],
        elements: null
      };
    }
    
    presentation.slides = presentation.slides.map(slide => ({
      ...slide,
      background: slide.background || { type: 'color', value: '#FFFFFF' },
      elements: slide.elements || []
    }));
    
    return presentation;
  } catch (error) {
    console.error('Parse presentation error:', error);
    return null;
  }
};