import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface BookLoadingAnimationProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  speed?: number;
  autoplay?: boolean;
  loop?: boolean;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12', 
  lg: 'h-16 w-16',
  xl: 'h-24 w-24'
};

export const BookLoadingAnimation: React.FC<BookLoadingAnimationProps> = ({ 
  size = 'md', 
  className = '',
  speed = 1,
  autoplay = true,
  loop = true
}) => {
  return (
    <div className={`inline-flex justify-center items-center ${className}`}>
      <DotLottieReact
        src="/animations/book.lottie"
        className={`${sizeClasses[size]} object-contain`}
        autoplay={autoplay}
        loop={loop}
        speed={speed}
      />
    </div>
  );
};