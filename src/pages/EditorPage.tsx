import React, { useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { type RootState } from '../store';
import SlidesList from '../components/SlidesList';
import SlideCanvas from '../components/SlideCanvas';
import BackgroundPicker from '../components/BackgroundPicker';
import ElementControls from '../components/ElementControls';
import PresentationManager from '../components/PresentationManager';
import TextControls from '../components/TextControls';
import { selectSelectedElementIds } from '../store/selectors';
import { 
  changePresentationTitle,
  addSlide,
  removeSlides,
  undo,
  redo,
  resetToDefault,
  loadPresentationState
} from '../store/presentation';
import { logout } from '../store/authSlice';
import { 
  savePresentation, 
  loadPresentations, 
  setAutoSave,
  setCurrentPresentationId,
  resetServerState
} from '../store/serverSlice';
import type { Presentation } from '../types';
import styles from '../App.module.css';
import { exportPresentationToPDF } from '../store/exportToPDF';

interface LoadedPresentationData {
  $id: string;
  presentation: Presentation;
}

const EditorPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const historyState = useSelector((state: RootState) => state.presentation);
  const auth = useSelector((state: RootState) => state.auth);
  const server = useSelector((state: RootState) => state.server);
  
  const editor = historyState.present;
  const selectedSlideId = editor.selection.slides[0] || '';
  const selectedSlideIndex = editor.slides.findIndex(slide => slide.id === selectedSlideId);
  const selectedSlideIds = editor.selection.slides;
  
  const selectedElementIds = useSelector((state: RootState) => 
    selectSelectedElementIds(state, selectedSlideId)
  );
  const selectedElement = editor.slides
    .find(s => s.id === selectedSlideId)
    ?.elements.find(e => e.id === selectedElementIds[0]);
  
  const handleExportPDF = async () => {
    await exportPresentationToPDF(editor.slides, { 
      filename: `${editor.title || 'presentation'}.pdf` 
    });
  };

  const handleStartPresentation = () => {
    if (editor.slides.length > 0) {
      navigate('/player');
    }
  };
  
  const canUndo = historyState.past.length > 0;
  const canRedo = historyState.future.length > 0;
  const lastSaveRef = useRef<number>(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const initialLoadRef = useRef<boolean>(false);

  // Load presentations when user authenticates
  useEffect(() => {
    if (auth.user && !initialLoadRef.current) {
      dispatch(loadPresentations());
      initialLoadRef.current = true;
    }
  }, [auth.user, dispatch]);

  // Handle authentication check
  useEffect(() => {
    if (!auth.loading && !auth.user) {
      navigate('/auth');
    }
  }, [auth, navigate]);

  // Auto-save logic
  useEffect(() => {
    if (server.autoSaveEnabled && auth.user) {
      const now = Date.now();
      if (now - lastSaveRef.current > 5000) {
        saveTimeoutRef.current = setTimeout(() => {
          dispatch(savePresentation(editor));
          lastSaveRef.current = Date.now();
        }, 1000);
      }
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [editor, server.autoSaveEnabled, auth.user, dispatch]);

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(changePresentationTitle(event.target.value));
  };

  const handleAddSlide = () => dispatch(addSlide( {insertAt: selectedSlideIndex + 1}));

  const handleRemoveSelectedSlides = () => {
    if (selectedSlideIds.length > 0) {
      dispatch(removeSlides(selectedSlideIds));
    }
  };

  const handleUndo = useCallback(() => {
    if (canUndo) {
      dispatch(undo());
    }
  }, [canUndo, dispatch]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      dispatch(redo());
    }
  }, [canRedo, dispatch]);

  const handleSave = () => {
    if (auth.user) {
      dispatch(savePresentation(editor));
    } else {
      alert('Please login to save');
    }
  };

  const handleNew = () => {
    dispatch(resetToDefault());
    dispatch(resetServerState());
  };

  const handleLoad = (data: LoadedPresentationData) => {
    dispatch(loadPresentationState(data.presentation));
    dispatch(setCurrentPresentationId(data.$id));
  };

  const handleAutoSaveChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setAutoSave(event.target.checked));
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/auth');
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? event.metaKey : event.ctrlKey;
      
      if (ctrlKey) {
        if (event.code === 'KeyZ' && !event.shiftKey) {
          event.preventDefault();
          handleUndo();
        } else if (event.code === 'KeyY' || (event.code === 'KeyZ' && event.shiftKey)) {
          event.preventDefault();
          handleRedo();
        }
      }

    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, editor, handleUndo, handleRedo]);


  return (
    <div className={styles['app-container']}>
      <div className={styles['presentation-title']}>
        <input
          type="text"
          value={editor.title}
          onChange={handleTitleChange}
          placeholder="Presentation Title"
          className={styles['title-input']}
        />
      </div>

      <div className={styles['controls-panel']}>
        <div className={styles['user-info']}>
          <div className={styles['user-info-text']}>
            Вошел в систему как: {auth.user?.name || auth.user?.email}
          </div>
          <PresentationManager onPresentationLoad={handleLoad} />
          <button onClick={handleNew} className={styles['control-button']}>
            Новая
          </button>
          <button 
            onClick={handleSave} 
            disabled={!auth.user || server.saving}
            className={styles['control-button']}
          >
            Сохранить
          </button>
          <label className={styles['auto-save-toggle']}>
            <input
              type="checkbox"
              checked={server.autoSaveEnabled}
              onChange={handleAutoSaveChange}
              className={styles['auto-save-checkbox']}
            />
            Авто-сохранение
          </label>
          <button 
            onClick={handleExportPDF} 
            className={`${styles['control-button']} ${styles['start-presentation-button']}`}
          >
            Экспортировать PDF
          </button>
          <button onClick={handleLogout} className={styles['control-button']}>
            Выйти
          </button>
        </div>

        <div className={styles['history-controls']}>
          <button 
            onClick={handleUndo} 
            disabled={!canUndo}
            className={styles['control-button']}
            title="Undo (Ctrl+Z)"
          >
            ↩ Отменить
          </button>
          <button 
            onClick={handleRedo} 
            disabled={!canRedo}
            className={styles['control-button']}
            title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
          >
            ↪ Вернуть
          </button>
          <div className={styles['history-info']}>
            История действия: {historyState.past.length}
          </div>
                  <button
          onClick={handleStartPresentation}
          disabled={editor.slides.length === 0}
          className={`${styles.controlButton} ${styles.startPresentationButton}`}
        >
          Начать презентацию
        </button>
        </div>

        <div className={styles['slide-controls']}>
          <button onClick={handleAddSlide} className={styles['control-button']}>
            Добавить слайд после текущего
          </button>
          <button 
            onClick={handleRemoveSelectedSlides} 
            disabled={selectedSlideIds.length === 0}
            className={styles['control-button']}
            title="Delete selected slides"
          >
            Удалить выбранные слайды ({selectedSlideIds.length})
          </button>
        </div>

        {selectedSlideId && (
          <>
            <BackgroundPicker slideId={selectedSlideId} />
            <ElementControls slideId={selectedSlideId} />
          </>
        )}
      </div>

      <div className={styles['main-content']}>
        <SlidesList />
        
        <div className={styles.workspace}>
          <h3>Рабочая область - {selectedSlideId ? `Слайд ${selectedSlideIndex + 1}` : 'Слайдов нет'}</h3>
          {selectedSlideId && <SlideCanvas />}
        </div>
        
        <div style={{
            width: '300px',
            minWidth: '300px',
            borderLeft: '1px solid #ddd',
            padding: '10px',
            backgroundColor: '#fff',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            boxSizing: 'border-box',
            overflowY: 'auto'
        }}>
            {selectedSlideId && selectedElementIds.length === 1 && selectedElement?.type === 'text'? (
                <>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem' }}>Настройки элемента</h3>
                  <TextControls
                    slideId={selectedSlideId}
                    elementId={selectedElementIds[0]}
                  />
                </>
            ) : (
                <div style={{ color: '#999', textAlign: 'center', marginTop: '20px' }}>
                    Выберите текстовый элемент для редактирования
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default EditorPage;