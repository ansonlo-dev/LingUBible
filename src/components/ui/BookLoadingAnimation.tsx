import React from 'react';

interface BookLoadingAnimationProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12', 
  lg: 'h-16 w-16',
  xl: 'h-24 w-24'
};

export const BookLoadingAnimation: React.FC<BookLoadingAnimationProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  return (
    <div className={`inline-flex justify-center items-center ${className}`}>
      <img 
        src="/book_stage2.gif"
        alt="載入中..."
        className={`${sizeClasses[size]} object-contain`}
        onError={() => {
          console.warn('Failed to load book animation GIF: /book_stage2.gif');
        }}
      />
    </div>
  );
};