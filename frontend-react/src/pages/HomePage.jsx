import React, { useEffect } from 'react';
import PostsGrid from '../components/home/PostsGrid';

const HomePage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full bg-[#F9F6F0] min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* HERO / TOPO EDITORIAL */}
        <section className="mb-10 sm:mb-12">
          
          {/* Tags Superiores */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="bg-red-editorial text-white text-[10px] sm:text-[11px] font-mono font-bold tracking-widest px-3 py-1 rounded-full uppercase shadow-sm">
              ✦ EDIÇÃO ABERTA ✦
            </span>
            <span className="text-[10px] sm:text-[11px] font-mono font-bold tracking-widest text-gray-500 uppercase">
              ✦ ✦ FEED MULTITEMÁTICO · LUMINA
            </span>
          </div>

          {/* Título Principal */}
          <h1 className="font-serif font-black text-4xl sm:text-5xl md:text-6xl text-graphite tracking-tight leading-[1.08] mb-4">
            Crônicas, Ensaios & <br />
            <span className="italic text-red-editorial">Perspectivas Plurais</span>.
          </h1>

          {/* Subtítulo Descritivo */}
          <p className="font-sans text-sm sm:text-base text-gray-600 max-w-2xl leading-relaxed">
            Navegue pelas últimas postagens da nossa comunidade editorial. Artigos selecionados cobrindo tecnologia, literatura, cinema e cotidiano.
          </p>

          {/* Linha Divisória Fina */}
          <div className="w-full border-b border-gray-300 mt-8"></div>
        </section>

        {/* FEED DE POSTS */}
        <section id="feed-section" className="pb-16">
          <PostsGrid />
        </section>

      </div>
    </div>
  );
};

export default HomePage;
