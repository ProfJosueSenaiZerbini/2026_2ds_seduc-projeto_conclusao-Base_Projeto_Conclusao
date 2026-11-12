import React from 'react';
import { Link } from 'react-router-dom';
import Tape from './Tape';

const PolaroidCard = ({ 
  image, 
  title, 
  subtitle, 
  caption, 
  link, 
  rotation = 0,
  className = '',
  children // for stamps or badges inside the image area
}) => {
  
  // Estilo de fita adesiva clássica e retrô
  const tapeVariant = rotation > 0 ? 'blue' : 'yellow';
  const tapeRotation = rotation > 0 ? -3 : 2;

  const content = (
    <>
      {/* Tape on top */}
      <Tape 
        variant={tapeVariant} 
        className="top-[-10px] left-1/2 -translate-x-1/2 w-14 sm:w-16 h-5 sm:h-6" 
        style={{ transform: `rotate(${tapeRotation}deg)` }} 
      />

      <div className="relative overflow-hidden bg-gray-200 aspect-[3/4] group">
        {image ? (
          <img
            src={image}
            alt={title || "Polaroid image"}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400 p-4 text-center">
            <span className="font-serif text-2xl mb-2">PLURAL</span>
            <span className="text-xs uppercase tracking-widest">Sem Imagem</span>
          </div>
        )}
        
        {/* Decorative elements like Stamps go here */}
        {children}
      </div>
      
      <div className="mt-3 text-center px-1">
        {title && (
          <h3 className="font-serif font-bold text-sm sm:text-base leading-tight text-graphite mb-1 line-clamp-1">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-gray-editorial text-[10px] sm:text-xs line-clamp-2 leading-relaxed mb-2">
            {subtitle}
          </p>
        )}
        {caption && (
          <p className="text-[9px] uppercase tracking-widest text-gray-400 font-sans mt-2">
            {caption}
          </p>
        )}
      </div>
    </>
  );

  const wrapperClasses = `polaroid relative bg-white p-2.5 pb-8 sm:pb-10 shadow-xl ${className}`;
  const inlineStyle = { transform: `rotate(${rotation}deg)` };

  if (link) {
    return (
      <Link to={link} className={`${wrapperClasses} block z-10 hover:z-20`} style={inlineStyle}>
        {content}
      </Link>
    );
  }

  return (
    <div className={`${wrapperClasses} z-10 hover:z-20`} style={inlineStyle}>
      {content}
    </div>
  );
};

export default PolaroidCard;
