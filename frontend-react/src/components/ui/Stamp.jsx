import React from 'react';

const Stamp = ({ 
  text, 
  color = 'red', // red or black
  size = 'md', // sm, md, lg
  className = '' 
}) => {
  const colors = {
    red: "text-red-editorial border-red-editorial",
    black: "text-graphite border-graphite",
  };

  const sizes = {
    sm: "w-12 h-12 text-[6px]",
    md: "w-16 h-16 sm:w-20 sm:h-20 text-[7px] sm:text-[8px]",
    lg: "w-24 h-24 text-[10px]",
  };

  return (
    <div 
      className={`stamp absolute flex items-center justify-center bg-cream/80 z-30 ${colors[color]} ${sizes[size]} ${className}`}
    >
      <span className="font-black uppercase text-center leading-tight" dangerouslySetInnerHTML={{ __html: text.replace('\n', '<br/>') }} />
    </div>
  );
};

export default Stamp;

