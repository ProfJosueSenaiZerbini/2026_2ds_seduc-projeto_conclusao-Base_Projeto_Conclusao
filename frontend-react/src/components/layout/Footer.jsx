import React from 'react';
import Sparkle from '../ui/Sparkle';

const Footer = () => {
  return (
    <footer className="border-t border-gray-300/40 mt-12 sm:mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-sans text-center sm:text-left">
          © {new Date().getFullYear()} LUMINA — Todos os direitos reservados.
        </p>
        
        <div className="flex items-center justify-center gap-1">
          <Sparkle className="text-red-editorial text-xs" />
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-sans mx-2">
            Feito com arte & código
          </p>
          <Sparkle className="text-red-editorial text-xs" delay={0.5} />
        </div>
      </div>
    </footer>
  );
};

export default Footer;

