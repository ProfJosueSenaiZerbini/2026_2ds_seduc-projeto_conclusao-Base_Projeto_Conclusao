import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Stamp from '../components/ui/Stamp';
import Sparkle from '../components/ui/Sparkle';

const NotFoundPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
      <Sparkle className="absolute top-20 left-1/4 text-red-editorial text-2xl z-0 opacity-50" delay={0} />
      <Sparkle className="absolute bottom-32 right-1/4 text-gray-400 text-xl z-0" delay={1} />
      
      <Stamp text="ERRO<br/>404" size="lg" color="red" className="relative mb-8 transform-none rotate-0 z-10" />
      
      <h2 className="font-serif font-black text-4xl md:text-5xl lg:text-6xl text-graphite mb-4 tracking-tight z-10">
        Ops! <span className="italic text-red-editorial">Saiu de cartaz.</span>
      </h2>
      
      <p className="text-gray-editorial mb-10 max-w-md font-sans z-10">
        Esta página não existe, foi movida ou a edição esgotou. Que tal voltar para a capa e explorar as novidades em destaque?
      </p>
      
      <Link 
        to="/" 
        className="btn-hover inline-flex items-center gap-2 bg-graphite text-white text-xs sm:text-sm font-bold uppercase tracking-wider px-8 py-4 rounded-sm z-10 hover:bg-black transition-colors"
      >
        <ArrowLeft size={16} /> VOLTAR PARA HOME
      </Link>
    </div>
  );
};

export default NotFoundPage;

