import React from 'react';

interface BookTextIconProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number | string;
}

export const BookTextIcon: React.FC<BookTextIconProps> = ({
  className = "h-6 w-6 flex-shrink-0",
  width = 24,
  height = 24,
  fill = "none",
  stroke = "currentColor",
  strokeWidth = 2,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
      <path d="M8 7h8"></path>
      <path d="M8 11h8"></path>
      <path d="M8 15h6"></path>
    </svg>
  );
};

export default BookTextIcon; 