import React from 'react';

const Sparkle = ({ className = '', delay = 0, style = {}, char = '✦' }) => {
  return (
    <span
      className={`sparkle select-none ${className}`}
      style={{
        animationDelay: `${delay}s`,
        ...style
      }}
      aria-hidden="true"
    >
      {char}
    </span>
  );
};

export default Sparkle;

