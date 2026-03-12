import React, { useRef } from 'react';
import { type NewElement } from '../types';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState } from '../store';
import { addElement, removeElement, selectElements } from '../store/presentation';
import { uploadImage } from '../store/serverSlice';

interface ElementControlsProps {
  slideId: string;
}

const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image dimensions'));
    };
  });
};

const ElementControls: React.FC<ElementControlsProps> = ({ 
  slideId
}) => {
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);
  const selectedElementIds = useSelector((state: RootState) => {
    const elementsSelection = state.presentation.present.selection.elements;
    return (elementsSelection && elementsSelection.slideId === slideId) 
      ? elementsSelection.elementIds 
      : [];
  });
  
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleAddText = () => {
    const newElement: NewElement = {
      type: 'text',
      content: 'Новый текст',
      position: { x: 50, y: 50 },
      size: { width: 200, height: 50 }
    };
    
    dispatch(addElement({ slideId, element: newElement }));
  };

  const handleAddImageFromFile = () => {
    if (!auth.user) {
      alert('Please login to upload images');
      return;
    }
    imageInputRef.current?.click();
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && auth.user) {
      try {
        const imageUrl = await dispatch(uploadImage(file)).unwrap();
        
        const { width: naturalWidth, height: naturalHeight } = await getImageDimensions(imageUrl);
        
        let width = naturalWidth;
        let height = naturalHeight;
        const maxWidth = 600;
        const maxHeight = 400;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        
        const newElement: NewElement = {
          type: 'image',
          src: imageUrl,
          position: { x: 100, y: 100 },
          size: { width, height }
        };
        
        dispatch(addElement({ slideId, element: newElement }));
      } catch (error) {
        console.error('Failed to upload or process image:', error);
        alert('Failed to upload or load image dimensions. Please try again.');
      }
    }
    
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleRemoveElements = () => {
    if (selectedElementIds.length > 0) {
      selectedElementIds.forEach(elementId => {
        dispatch(removeElement({ slideId, elementId }));
      });
    }
  };

  const handleClearSelection = () => {
    dispatch(selectElements({ slideId, elementIds: [] }));
  };

  return (
    <div style={{ marginBottom: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
      <button onClick={handleAddText}>
        Добавить текст
      </button>
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />
      <button onClick={handleAddImageFromFile} disabled={!auth.user}>
        {auth.user ? 'Загрузить изображение' : 'Login to upload images'}
      </button>
      <button 
        onClick={handleRemoveElements} 
        disabled={selectedElementIds.length === 0}
        title="Удалить выбранные элементы"
      >
        Удалить выбранные ({selectedElementIds.length})
      </button>
      <button 
        onClick={handleClearSelection} 
        disabled={selectedElementIds.length === 0}
        title="Снять выделение"
      >
        Снять выделение
      </button>
    </div>
  );
};

export default ElementControls;