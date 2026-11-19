import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { searchPosts, getDemo } from '../../services/api';
import { Search, Loader2 } from 'lucide-react';

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // Chama o endpoint de busca mapeado na API
      const results = await searchPosts(searchQuery);
      console.log('Resultados da busca:', results);
      // Aqui você poderia redirecionar para uma página de resultados ou atualizar um estado global
      alert(`Busca concluída para: ${searchQuery}`);
    } catch (error) {
      console.error('Erro na busca:', error);
      alert('Erro ao realizar a busca. Tente novamente.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleDemoClick = () => {
    // Redireciona para o login/apresentação conforme solicitado
    navigate('/login');
  };

  return (
    <div className="flex flex-col justify-center space-y-6 md:space-y-8 pt-2 lg:pt-6">
      
      {/* Badge: Edição Especial */}
      <Badge variant="filled">EDIÇÃO ESPECIAL</Badge>

      {/* Main Title - Misto Serif/Itálico */}
      <div className="space-y-0 leading-none select-none">
        <h2 className="font-serif font-black text-6xl sm:text-7xl md:text-8xl lg:text-[6.5rem] text-graphite leading-[0.9] tracking-tight">
          Welcome.
        </h2>
        <div className="flex items-center flex-wrap gap-x-3 sm:gap-x-4">
          <h2 className="font-serif font-bold italic text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] text-red-editorial leading-[1] tracking-tight">
            Descubra
          </h2>
          <h2 className="font-serif font-black text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] text-graphite leading-[1] tracking-tight">
            o novo.
          </h2>
        </div>
      </div>

      {/* Subtitle */}
      <p className="text-gray-editorial text-sm sm:text-base leading-relaxed max-w-md font-sans font-light">
         Arte que transforma. Nossa plataforma une o design clássico editorial com a interatividade moderna.
      </p>

      {/* Search Bar (Estilo Editorial) */}
      <form onSubmit={handleSearch} className="relative max-w-md w-full">
        <div className="flex items-center border-2 border-graphite rounded-sm overflow-hidden bg-white/50 focus-within:bg-white transition-colors">
          <input
            type="text"
            placeholder="Pesquisar artigos, edições..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent px-4 py-3 text-graphite placeholder-gray-400 font-sans text-sm focus:outline-none"
            disabled={isSearching}
          />
          <button
            type="submit"
            disabled={isSearching}
            className="bg-graphite text-white px-4 py-3 hover:bg-black transition-colors flex items-center justify-center min-w-[3rem]"
          >
            {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
          </button>
        </div>
      </form>

      {/* CTAs */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        {/* Botão 1: Ação Principal (Demo/Free Trial) */}
        <Button 
          variant="solid" 
          onClick={handleDemoClick}
          className="bg-red-editorial hover:bg-red-strong border-2 border-transparent"
        >
          {isDemoLoading ? (
            <><Loader2 size={16} className="animate-spin" /> CARREGANDO...</>
          ) : (
            <>CONHECER A PLATAFORMA <span className="text-base font-normal">→</span></>
          )}
        </Button>

        {/* Botão 2: Ação Secundária (See More) */}
        <Button variant="outline" onClick={() => document.getElementById('recursos')?.scrollIntoView({ behavior: 'smooth' })}>
          EXPLORAR CATEGORIAS
        </Button>
      </div>

    </div>
  );
};

export default HeroSection;
