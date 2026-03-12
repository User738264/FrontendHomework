import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState } from '../store';
import { selectSlides, loadPresentationState } from '../store/presentation';
import { 
  loadPresentations, 
  loadPresentation as loadServerPresentation,
  deletePresentation,
  setCurrentPresentationId
} from '../store/serverSlice';
import type { Presentation } from '../types';

interface ServerPresentation {
  $id: string;
  title: string;
  presentation: Presentation;
  createdAt: string;
  updatedAt: string;
}

interface PresentationManagerProps {
  onPresentationLoad?: (presentationData: ServerPresentation) => void;
}

const PresentationManager: React.FC<PresentationManagerProps> = ({ 
  onPresentationLoad 
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { presentations, loading } = useSelector((state: RootState) => state.server);
  const auth = useSelector((state: RootState) => state.auth);
  const presentation = useSelector((state: RootState) => state.presentation.present);
  
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (auth.user && isOpen) {
      dispatch(loadPresentations());
    }
  }, [auth.user, isOpen, dispatch]);

  const handleLoadPresentation = async (id: string) => {
    try {
      const result = await dispatch(loadServerPresentation(id));
      if (loadServerPresentation.fulfilled.match(result)) {
        dispatch(loadPresentationState(result.payload.presentation));
        dispatch(setCurrentPresentationId(result.payload.$id));
        
        if (result.payload.presentation.slides.length > 0) {
          dispatch(selectSlides([result.payload.presentation.slides[0].id]));
        }
        
        if (onPresentationLoad) {
          onPresentationLoad(result.payload);
        }
        
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Failed to load presentation:', error);
    }
  };

  const handleDeletePresentation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Вы уверены, что хотите удалить эту презентацию?')) {
      await dispatch(deletePresentation(id));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU') + ' ' + date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!auth.user) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '8px 16px',
          backgroundColor: '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginRight: '10px'
        }}
      >
        Мои презентации ({presentations.length})
      </button>
      
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          width: '500px',
          maxHeight: '600px',
          backgroundColor: '#fff',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          zIndex: 1000,
          padding: '15px',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0 }}>Мои презентации</h3>
            <button 
              onClick={() => setIsOpen(false)} 
              style={{ 
                background: 'none', 
                border: 'none', 
                fontSize: '20px', 
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ×
            </button>
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px' }}>Загрузка...</div>
          ) : presentations.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '30px', 
              color: '#666',
              border: '1px dashed #ddd',
              borderRadius: '4px'
            }}>
              У вас пока нет сохраненных презентаций
              <div style={{ marginTop: '10px', fontSize: '14px' }}>
                Создайте презентацию и она появится здесь после сохранения
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {presentations.map((pres) => {
                const isCurrent = presentation.title === pres.title;
                
                return (
                  <div
                    key={pres.$id}
                    onClick={() => handleLoadPresentation(pres.$id)}
                    style={{
                      padding: '15px',
                      border: `2px solid ${isCurrent ? '#007bff' : '#e0e0e0'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      backgroundColor: isCurrent ? '#f0f8ff' : '#fff',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>
                        {pres.title}
                        {isCurrent && (
                          <span style={{ 
                            fontSize: '12px', 
                            color: '#007bff', 
                            marginLeft: '8px',
                            backgroundColor: '#e3f2fd',
                            padding: '2px 6px',
                            borderRadius: '10px'
                          }}>
                            Текущая
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => handleDeletePresentation(pres.$id, e)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ff4444',
                          cursor: 'pointer',
                          fontSize: '16px',
                          padding: '0 5px'
                        }}
                        title="Удалить презентацию"
                      >
                        🗑️
                      </button>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      fontSize: '13px',
                      color: '#666',
                      marginBottom: '8px'
                    }}>
                      <div>
                        <strong>Слайдов:</strong> {pres.presentation.slides.length}
                      </div>
                      <div>
                        <strong>Элементов:</strong> {pres.presentation.slides.reduce((acc, slide) => acc + slide.elements.length, 0)}
                      </div>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      color: '#888'
                    }}>
                      <div>
                        <strong>Создана:</strong> {formatDate(pres.createdAt)}
                      </div>
                      <div>
                        <strong>Изменена:</strong> {formatDate(pres.updatedAt)}
                      </div>
                    </div>
                    
                    <div style={{
                      position: 'absolute',
                      top: '5px',
                      right: '5px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: isCurrent ? '#28a745' : '#6c757d'
                    }} />
                  </div>
                );
              })}
            </div>
          )}
          
          <div style={{ 
            marginTop: '15px', 
            paddingTop: '15px', 
            borderTop: '1px solid #eee',
            textAlign: 'center',
            fontSize: '13px',
            color: '#666'
          }}>
            Нажмите на презентацию, чтобы загрузить её
          </div>
        </div>
      )}
    </div>
  );
};

export default PresentationManager;