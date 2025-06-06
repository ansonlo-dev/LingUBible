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
      
      {/* 減少羽毛數量 - 只保留6根 */}
      <div className="heaven-feathers">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`heaven-feather heaven-feather-${i + 1}`}>
            <svg viewBox="0 0 20 60" className="feather-svg">
              <path
                d="M10,5 Q8,10 6,20 Q5,30 7,40 Q9,50 10,55 Q11,50 13,40 Q15,30 14,20 Q12,10 10,5 Z"
                fill="rgba(255,255,255,0.8)"
                stroke="rgba(255,215,0,0.4)"
                strokeWidth="0.5"
              />
            </svg>
          </div>
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