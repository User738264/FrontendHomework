import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { type RootState } from '../store';
import { type Slide } from '../types';
import styles from './PresentationPlayer.module.css';

interface PresentationPlayerProps {
  onClose: () => void;
}

const PresentationPlayer: React.FC<PresentationPlayerProps> = ({ onClose }) => {
  const presentation = useSelector((state: RootState) => state.presentation.present);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const currentSlide = presentation.slides[currentSlideIndex];

  const goToNextSlide = useCallback(() => {
    if (currentSlideIndex < presentation.slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
    }
  }, [currentSlideIndex, presentation.slides.length]);

  const goToPreviousSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  }, [currentSlideIndex]);

  const goToFirstSlide = useCallback(() => {
    setCurrentSlideIndex(0);
  }, []);

  const goToLastSlide = useCallback(() => {
    setCurrentSlideIndex(presentation.slides.length - 1);
  }, [presentation.slides.length]);

  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < presentation.slides.length) {
      setCurrentSlideIndex(index);
    }
  }, [presentation.slides.length]);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const handleSlideClick = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    if (x < rect.width / 3) {
      goToPreviousSlide();
    } else if (x > (rect.width * 2) / 3) {
      goToNextSlide();
    }
  }, [goToPreviousSlide, goToNextSlide]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getBackgroundStyle = (slide: Slide) => {
    if (slide.background.type === 'color') {
      return { background: slide.background.value };
    } else if (slide.background.type === 'gradient') {
      return { background: `linear-gradient(${slide.background.value.join(', ')})` };
    } else if (slide.background.type === 'image') {
      return { background: `url(${slide.background.value}) center/cover no-repeat` };
    }
    return {};
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Use event.code instead of event.key
      switch (event.code) {
        case 'ArrowLeft':
        case 'PageUp':
          event.preventDefault();
          goToPreviousSlide();
          break;
        case 'ArrowRight':
        case 'PageDown':
        case 'Space':
          event.preventDefault();
          goToNextSlide();
          break;
        case 'Home':
          event.preventDefault();
          goToFirstSlide();
          break;
        case 'End':
          event.preventDefault();
          goToLastSlide();
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
        case 'F5':
        case 'KeyF':
          event.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyP':
          event.preventDefault();
          togglePlay();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPreviousSlide, goToNextSlide, goToFirstSlide, goToLastSlide, onClose, toggleFullscreen, togglePlay]);

  useEffect(() => {
    if (isPlaying && timer === null) {
      const interval = setInterval(() => {
        goToNextSlide();
      }, 3000);
      
      setTimer(interval);
    } else if (!isPlaying && timer) {
      clearInterval(timer);
      setTimer(null);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isPlaying, timer, goToNextSlide]);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles['presentation-player']}>
      <div className={styles['player-controls']}>
        <div className={styles['controls-left']}>
          <button onClick={onClose} className={styles['control-button']} title="Exit (Esc)">
            Выход
          </button>
          <span className={styles['presentation-title']}>{presentation.title}</span>
        </div>
        
        <div className={styles['controls-center']}>
          <button 
            onClick={goToFirstSlide} 
            className={styles['control-button']}
            title="First slide (Home)"
            disabled={currentSlideIndex === 0}
          >
            ⏮
          </button>
          <button 
            onClick={goToPreviousSlide} 
            className={styles['control-button']}
            title="Previous slide (←)"
            disabled={currentSlideIndex === 0}
          >
            ◀
          </button>
          
          <div className={styles['slide-counter']}>
            Слайд {currentSlideIndex + 1} / {presentation.slides.length}
          </div>
          
          <button 
            onClick={goToNextSlide} 
            className={styles['control-button']}
            title="Next slide (→ or Space)"
            disabled={currentSlideIndex === presentation.slides.length - 1}
          >
            ▶
          </button>
          <button 
            onClick={goToLastSlide} 
            className={styles['control-button']}
            title="Last slide (End)"
            disabled={currentSlideIndex === presentation.slides.length - 1}
          >
            ⏭
          </button>
        </div>
        
        <div className={styles['controls-right']}>
          <button 
            onClick={togglePlay} 
            className={`${styles['control-button']} ${isPlaying ? styles.playing : ''}`}
            title="Auto-play (P)"
          >
            {isPlaying ? '⏸' : '▶️'} Авто
          </button>
          <button 
            onClick={toggleFullscreen} 
            className={styles['control-button']}
            title="Fullscreen (F)"
          >
            {isFullscreen ? '⤓' : '⤢'} Полный экран
          </button>
          <div className={styles.timer}>
            {formatTime(elapsedTime)}
          </div>
        </div>
      </div>

      <div 
        className={styles['slide-container']} 
        onClick={handleSlideClick}
      >
        <div 
          className={styles['slide-content']}
          style={getBackgroundStyle(currentSlide)}
        >
          {currentSlide.elements.map((element) => {
            if (element.type === 'text') {
              return (
                <div
                  key={element.id}
                  className={styles['player-text-element']}
                  style={{
                    position: 'absolute',
                    left: `${element.position.x}px`,
                    top: `${element.position.y}px`,
                    width: `${element.size.width}px`,
                    height: `${element.size.height}px`,
                    fontSize: `${element.fontSize}px`,
                    fontFamily: element.fontFamily,
                    color: element.color,
                    overflow: 'hidden',
                    padding: '5px',
                    boxSizing: 'border-box'
                  }}
                >
                  {element.content}
                </div>
              );
            } else if (element.type === 'image') {
              return (
                <div
                  key={element.id}
                  className={styles['player-image-element']}
                  style={{
                    position: 'absolute',
                    left: `${element.position.x}px`,
                    top: `${element.position.y}px`,
                    width: `${element.size.width}px`,
                    height: `${element.size.height}px`,
                    backgroundImage: `url(${element.src})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }}
                />
              );
            }
            return null;
          })}
        </div>
      </div>

      <div className={styles['slide-thumbnails']}>
        {presentation.slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`${styles.thumbnail} ${index === currentSlideIndex ? styles.active : ''}`}
            onClick={() => goToSlide(index)}
            title={`Go to slide ${index + 1}`}
          >
            <div className={styles['thumbnail-number']}>{index + 1}</div>
            <div 
              className={styles['thumbnail-preview']}
              style={getBackgroundStyle(slide)}
            >
              {slide.elements.map((element, elIndex) => (
                <div
                  key={elIndex}
                  className={styles['thumbnail-element']}
                  style={{
                    position: 'absolute',
                    left: `${element.position.x / 10}px`,
                    top: `${element.position.y / 10}px`,
                    width: `${element.size.width / 10}px`,
                    height: `${element.size.height / 10}px`,
                    backgroundColor: element.type === 'text' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(200, 200, 200, 0.5)',
                    border: '1px solid rgba(0, 0, 0, 0.2)'
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={styles['player-hints']}>
        <div className={styles['hint-item']}>← → или пробел: Смена слайдов</div>
        <div className={styles['hint-item']}>F: Полный экран</div>
        <div className={styles['hint-item']}>P: Авто-проигрывание</div>
        <div className={styles['hint-item']}>Esc: Выход</div>
      </div>
    </div>
  );
};

export default PresentationPlayer;