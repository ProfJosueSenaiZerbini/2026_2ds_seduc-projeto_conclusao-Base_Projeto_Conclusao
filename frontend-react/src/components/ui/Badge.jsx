import React from 'react';
import Sparkle from './Sparkle';

const Badge = ({ children, variant = 'filled', className = '' }) => {
  const baseClasses = "inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full select-none";
  
  const variants = {
    filled: "bg-red-editorial text-white",
    outline: "bg-transparent border border-gray-400/50 text-gray-editorial",
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`${baseClasses} ${variants[variant]} ${className}`}>
        {variant === 'filled' && <Sparkle className="text-white text-[10px] m-0" delay={0} />}
        {children}
        {variant === 'filled' && <Sparkle className="text-white text-[10px] m-0" delay={0.5} />}
      </span>
      {variant === 'filled' && (
        <>
          <span className="text-red-editorial text-xs sparkle select-none">+</span>
          <span className="text-red-editorial text-sm sparkle select-none" style={{ animationDelay: '0.5s' }}>✦</span>
        </>
      )}
    </div>
  );
};

export default Badge;

