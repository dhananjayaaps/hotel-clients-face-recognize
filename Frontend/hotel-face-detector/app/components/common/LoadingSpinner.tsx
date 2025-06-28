import React from 'react';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  fullScreen = false, 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-4',
    lg: 'w-16 h-16 border-4'
  };
  
  const containerClasses = fullScreen 
    ? 'fixed inset-0 flex items-center justify-center bg-black bg-opacity-20 z-50' 
    : 'flex justify-center py-8';

  return (
    <div className={containerClasses}>
      <div 
        className={`animate-spin rounded-full border-t-transparent ${sizeClasses[size]} border-blue-600`}
      ></div>
    </div>
  );
};

export default LoadingSpinner;