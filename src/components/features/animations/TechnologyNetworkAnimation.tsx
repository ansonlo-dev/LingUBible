import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface TechnologyNetworkAnimationProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  speed?: number;
  autoplay?: boolean;
  loop?: boolean;
}

const sizeClasses = {
  sm: 'h-16 w-16',
  md: 'h-24 w-24',
  lg: 'h-32 w-32',
  xl: 'h-48 w-48',
  '2xl': 'h-64 w-64',
  '3xl': 'h-80 w-80'
};

export const TechnologyNetworkAnimation: React.FC<TechnologyNetworkAnimationProps> = ({
  className = '',
  size = 'xl',
  speed = 0.5,
  autoplay = true,
  loop = true
}) => {
  return (
    <div className={`inline-flex justify-center items-center ${className}`}>
      <DotLottieReact
        src="/animations/technology-network-red.lottie"
        className={`${sizeClasses[size]} object-contain`}
        autoplay={autoplay}
        loop={loop}
        speed={speed}
      />
    </div>
  );
};