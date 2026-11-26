import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { Loader2 } from 'lucide-react';

const HeroSection = () => {
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const navigate = useNavigate();

  const handleDemoClick = () => {
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

      {/* CTAs */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        {/* Botão 1: Ação Principal (Entrar / Conhecer) */}
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

        {/* Botão 2: Ação Secundária */}
        <Button variant="outline" onClick={() => navigate('/login')}>
          ENTRAR NA COMUNIDADE
        </Button>
      </div>

    </div>
  );
};

export default HeroSection;
