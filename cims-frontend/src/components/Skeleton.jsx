import React from 'react';
import './Skeleton.css';

function Skeleton({ width, height, borderRadius, className = '', variant = 'text' }) {
  const styles = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'text' ? '1rem' : undefined),
    borderRadius: borderRadius || (variant === 'circle' ? '50%' : '4px'),
  };

  return (
    <div
      className={`cims-skeleton skeleton-${variant} ${className}`}
      style={styles}
    />
  );
}

export default Skeleton;
