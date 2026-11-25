import React from 'react';

const Tape = ({ variant = 'yellow', className = '', style = {} }) => {
  const getTapeClass = () => {
    switch (variant) {
      case 'blue':
        return 'tape-blue';
      case 'purple':
        return 'tape-purple';
      case 'pink':
        return 'tape-pink';
      case 'yellow':
      default:
        return 'tape';
    }
  };
  
  return (
    <div 
      className={`${getTapeClass()} absolute rounded-sm z-30 opacity-85 ${className}`} 
      style={style}
    ></div>
  );
};

export default Tape;
