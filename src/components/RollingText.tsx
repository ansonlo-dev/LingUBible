
import { useState, useEffect } from 'react';

interface RollingTextProps {
  texts: string[];
  interval?: number;
}

export function RollingText({ texts, interval = 2000 }: RollingTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % texts.length);
    }, interval);

    return () => clearInterval(timer);
  }, [texts.length, interval]);

  return (
    <span className="rolling-text">
      {texts.map((text, index) => (
        <span
          key={text}
          className={`rolling-text-item ${
            index === currentIndex ? 'active' : ''
          }`}
          style={{
            transform: index === currentIndex ? 'translateY(0)' : 'translateY(100%)',
            opacity: index === currentIndex ? 1 : 0,
          }}
        >
          {text}
        </span>
      ))}
    </span>
  );
}
