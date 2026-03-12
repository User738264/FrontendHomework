import React, { useRef } from 'react';
import { useDispatch } from 'react-redux';
import { type SlideBackground } from '../types';
import { changeSlideBackground } from '../store/presentation';

interface BackgroundPickerProps {
  slideId: string;
}

const BackgroundPicker: React.FC<BackgroundPickerProps> = ({ slideId }) => {
  const dispatch = useDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const color = event.target.value;
    const background: SlideBackground = {
      type: 'color',
      value: color
    };
    dispatch(changeSlideBackground({ slideId, background }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const background: SlideBackground = {
          type: 'image',
          value: e.target?.result as string
        };
        dispatch(changeSlideBackground({ slideId, background }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGradientClick = () => {
    const background: SlideBackground = {
      type: 'gradient',
      value: ['#FF0000', '#0000FF']
    };
    dispatch(changeSlideBackground({ slideId, background }));
  };

  return (
    <div style={{ marginBottom: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
      <label>Фон слайда:</label>
      <input 
        type="color" 
        onChange={handleColorChange}
        title="Цвет фона"
      />
      <button onClick={handleGradientClick} title="Градиент">
        Градиент
      </button>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />
      <button onClick={() => fileInputRef.current?.click()} title="Загрузить изображение">
        Изображение
      </button>
    </div>
  );
};

export default BackgroundPicker;