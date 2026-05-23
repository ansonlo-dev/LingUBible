import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface HeavenTransitionProps {
  isActive: boolean;
  onComplete: () => void;
  duration?: number;
  buttonPosition?: { x: number; y: number };
}

export const HeavenTransition: React.FC<HeavenTransitionProps> = ({
  isActive,
  onComplete,
  duration = 1200,
  buttonPosition
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isActive) {
      setIsVisible(true);
      console.log('Heaven transition started with button position:', buttonPosition);
      
      // 在轉場完成後調用回調
      const timer = setTimeout(() => {
        console.log('Heaven transition completing, calling onComplete');
        onComplete();
        setIsVisible(false);
      }, duration);

      return () => {
        clearTimeout(timer);
      };
    } else {
      setIsVisible(false);
    }
  }, [isActive, duration]);

  if (!isVisible) return null;

  return createPortal(
    <div className="heaven-transition-overlay">
      {/* 主要光芒效果 */}
      <div 
        className="heaven-light-burst"
        style={buttonPosition ? {
          left: `${buttonPosition.x}px`,
          top: `${buttonPosition.y}px`,
          transform: 'translate(-50%, -50%)'
        } : {}}
      ></div>
      
      {/* 簡化的雲朵效果 - 只保留3朵 */}
      <div className="heaven-clouds">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`heaven-cloud heaven-cloud-${i + 1}`}></div>
        ))}
      </div>
      

      
      {/* 減少粒子數量 - 只保留8個 */}
      <div className="heaven-particles">
        {[...Array(8)].map((_, i) => (
          <div key={i} className={`heaven-particle heaven-particle-${i + 1}`}></div>
        ))}
      </div>
    </div>,
    document.body
  );
}; 