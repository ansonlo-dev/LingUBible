import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface TechnologyNetworkAnimationProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  speed?: number;
  autoplay?: boolean;
  loop?: boolean;
}

const sizeClasses = {
  sm: 'h-16 w-16',
  md: 'h-24 w-24',
  lg: 'h-32 w-32',
  xl: 'h-48 w-48'
};

export const TechnologyNetworkAnimation: React.FC<TechnologyNetworkAnimationProps> = ({
  className = '',
  size = 'lg',
  speed = 1,
  autoplay = true,
  loop = true
}) => {
  return (
    <div className={`inline-flex justify-center items-center ${className}`}>
      <DotLottieReact
        src="/animations/technology-network.lottie"
        className={`${sizeClasses[size]} object-contain`}
        autoplay={autoplay}
        loop={loop}
        speed={speed}
      />
    </div>
  );
};