import React from 'react';
import { Link } from 'react-router-dom';

const Button = ({ children, variant = 'solid', to, onClick, className = '', ...props }) => {
  const baseClasses = "btn-hover inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider px-6 py-3 rounded-sm whitespace-nowrap transition-colors";
  
  const variants = {
    solid: "bg-graphite text-white hover:bg-black",
    outline: "bg-transparent border-2 border-graphite text-graphite hover:bg-graphite hover:text-white",
  };

  const combinedClasses = `${baseClasses} ${variants[variant]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={combinedClasses} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={combinedClasses} {...props}>
      {children}
    </button>
  );
};

export default Button;

