import { useState, useEffect, useRef } from 'react';

interface RollingTextProps {
  texts: string[];
  interval?: number;
}

export function RollingText({ texts, interval = 2000 }: RollingTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % texts.length);
    }, interval);

    return () => clearInterval(timer);
  }, [texts.length, interval]);

  // 計算最長文字的寬度，並確保每個文字都能居中對齊
  useEffect(() => {
    if (containerRef.current) {
      // 創建一個臨時元素來測量文字寬度
      const tempElement = document.createElement('span');
      tempElement.style.visibility = 'hidden';
      tempElement.style.position = 'absolute';
      tempElement.style.whiteSpace = 'nowrap';
      tempElement.style.fontSize = '1.125rem'; // text-lg
      tempElement.style.fontWeight = '600';
      
      document.body.appendChild(tempElement);
      
      let maxWidth = 0;
      texts.forEach(text => {
        tempElement.textContent = text;
        const width = tempElement.offsetWidth;
        if (width > maxWidth) {
          maxWidth = width;
        }
      });
      
      document.body.removeChild(tempElement);
      
      // 設置容器寬度，確保所有文字都能在這個寬度內居中
      containerRef.current.style.width = `${maxWidth + 8}px`; // 添加更多空間確保居中
      containerRef.current.style.textAlign = 'center'; // 確保文字居中
    }
  }, [texts]);

  return (
    <span ref={containerRef} className="rolling-text">
      {texts.map((text, index) => (
        <span
          key={text}
          className={`rolling-text-item ${
            index === currentIndex ? 'active' : ''
          }`}
          style={{
            transform: index === currentIndex ? 'translateY(0)' : 'translateY(100%)',
            opacity: index === currentIndex ? 1 : 0,
            textAlign: 'center',
            width: '100%',
            display: 'block',
          }}
        >
          {text}
        </span>
      ))}
    </span>
  );
}
