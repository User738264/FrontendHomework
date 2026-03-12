import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState } from '../store';
import { updateTextProperties } from '../store/presentation/presentationSlice';
import { selectTextElement } from '../store/selectors';

interface TextControlsProps {
  slideId: string;
  elementId: string;
}

const commonFontFamilies = [
  'Arial',
  'Times New Roman',
  'Courier New',
  'Georgia',
  'Trebuchet MS',
];

const TextControls: React.FC<TextControlsProps> = ({ slideId, elementId }) => {
  const dispatch = useDispatch();

  const textElement = useSelector((state: RootState) =>
    selectTextElement(state, slideId, elementId)
  );

  if (!textElement) return null;

  const handleChange = (
    field: 'fontSize' | 'fontFamily' | 'color',
    value: string | number
  ) => {
    dispatch(
      updateTextProperties({
        slideId,
        elementId,
        updates: { [field]: value },
      })
    );
  };

  return (
    <div style={{
      marginTop: '12px',
      padding: '12px',
      background: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '6px',
    }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Настройки текста</h4>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
          Размер шрифта:
        </label>
        <input
          type="number"
          min={8}
          max={120}
          step={1}
          value={textElement.fontSize}
          onChange={e => handleChange('fontSize', Number(e.target.value))}
          style={{ width: '80px', padding: '6px' }}
        />
        <span style={{ marginLeft: '8px', fontSize: '13px' }}>px</span>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
          Шрифт:
        </label>
        <select
          value={textElement.fontFamily}
          onChange={e => handleChange('fontFamily', e.target.value)}
          style={{ width: '180px', padding: '6px' }}
        >
          {commonFontFamilies.map(font => (
            <option key={font} value={font} style={{ fontFamily: font }}>
              {font}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
          Цвет текста:
        </label>
        <input
          type="color"
          value={textElement.color}
          onChange={e => handleChange('color', e.target.value)}
          style={{ width: '60px', height: '32px', padding: 0, border: 'none' }}
        />
        <span style={{ marginLeft: '10px', fontSize: '13px', color: '#666' }}>
          {textElement.color}
        </span>
      </div>
    </div>
  );
};

export default TextControls;