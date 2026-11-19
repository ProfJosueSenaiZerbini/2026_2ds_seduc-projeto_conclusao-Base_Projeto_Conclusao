import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePosts } from '../../hooks/usePosts';
import { User, Clock, Heart, ArrowRight, Loader2 } from 'lucide-react';

const MOCK_CARDS = [
  {
    id: 'mock-1',
    categoria: 'TECNOLOGIA',
    autor: 'Lucas Almeida',
    tempoLeitura: '5 min de leitura',
    titulo: 'O Futuro da Inteligência Artificial no Design e na Criatividade',
    resumo: 'Como os novos modelos gerativos estão transformando o fluxo de trabalho dos criativos e o debate ético sobre autoria nas artes digitais.',
    likes: 42,
    imagem: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=400&fit=crop'
  },
  {
    id: 'mock-2',
    categoria: 'FILMES & CINEMA',
    autor: 'Beatriz Vasconcelos',
    tempoLeitura: '8 min de leitura',
    titulo: 'O Renascimento do Cinema em Película de 35mm',
    resumo: 'Grandes diretores contemporâneos voltam a escolher rolos analógicos para capturar a textura e a nostalgia que o sensor digital não reproduz.',
    likes: 89,
    imagem: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&h=400&fit=crop'
  },
  {
    id: 'mock-3',
    categoria: 'COTIDIANO & ESTILO',
    autor: 'Juliana Mendes',
    tempoLeitura: '4 min de leitura',
    titulo: 'Elogio à Lentidão: Como Redescobrir o Prazer do Café e da Manhã',
    resumo: 'Em uma rotina hiperconectada e acelerada, resgatar pequenos rituais sem telas é um ato de resistência e cuidado com a saúde mental.',
    likes: 65,
    imagem: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&h=400&fit=crop'
  },
  {
    id: 'mock-4',
    categoria: 'LIVROS & LITERATURA',
    autor: 'Rafael Costa',
    tempoLeitura: '6 min de leitura',
    titulo: 'Vozes Emergentes na Literatura Latino-Americana',
    resumo: 'Novos romances que exploram realismo mágico contemporâneo e conflitos sociais através de narrativas viscerais e inovadoras.',
    likes: 54,
    imagem: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=400&fit=crop'
  },
  {
    id: 'mock-5',
    categoria: 'MÚSICA & CULTURA',
    autor: 'Camila Rocha',
    tempoLeitura: '7 min de leitura',
    titulo: 'A Ressonância do Jazz nas Batidas Urbanas Modernas',
    resumo: 'Produtores independentes redescobrem a improvisação do jazz para reinventar os ritmos do hip-hop e da música instrumental.',
    likes: 71,
    imagem: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=400&fit=crop'
  },
  {
    id: 'mock-6',
    categoria: 'DESIGN & ESPAÇO',
    autor: 'Thiago Silva',
    tempoLeitura: '5 min de leitura',
    titulo: 'Minimalismo Quente: A Arquitetura dos Espaços Acolhedores',
    resumo: 'Como o design de interiores contemporâneo substituiu a frieza do concreto por madeira natural, iluminação orgânica e memória afetiva.',
    likes: 38,
    imagem: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&h=400&fit=crop'
  }
];

const PostsGrid = () => {
  const { posts, loading, error } = usePosts();
  const [likesState, setLikesState] = useState({});

  const handleLike = (e, postId, initialLikes = 42) => {
    e.preventDefault();
    e.stopPropagation();
    setLikesState(prev => {
      const current = prev[postId] || { count: initialLikes, liked: false };
      return {
        ...prev,
        [postId]: {
          count: current.liked ? current.count - 1 : current.count + 1,
          liked: !current.liked
        }
      };
    });
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center">
        <Loader2 size={36} className="animate-spin text-red-editorial mb-4" />
        <p className="font-mono text-xs uppercase tracking-widest text-gray-500">
          Carregando feed editorial...
        </p>
      </div>
    );
  }

  // Lista consolidada: se houver posts no banco, exibe os do banco no topo
  let displayPosts = [];

  if (posts && posts.length > 0) {
    // Normaliza os posts vindos da API
    const realPosts = posts.map((p, idx) => ({
      id: p.id,
      categoria: p.categoria || 'RESENHA & CRÍTICA',
      autor: p.autor || p.a || 'Redação Lumina',
      tempoLeitura: '5 min de leitura',
      titulo: p.titulo,
      resumo: p.resumo || (p.conteudo ? p.conteudo.substring(0, 160) + '...' : 'Sem resumo.'),
      likes: 24 + ((p.id * 7) % 70),
      imagem: p.imagem || MOCK_CARDS[idx % MOCK_CARDS.length].imagem,
      isReal: true
    }));

    // Se tiver menos de 3 posts reais, complementa com os mock posts para manter o grid bonito
    if (realPosts.length < 3) {
      displayPosts = [...realPosts, ...MOCK_CARDS.slice(realPosts.length)];
    } else {
      displayPosts = realPosts;
    }
  } else {
    displayPosts = MOCK_CARDS;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
      {displayPosts.map((post) => {
        const likeInfo = likesState[post.id] || { count: post.likes || 42, liked: false };

        return (
          <article
            key={post.id}
            className="group bg-white border-2 border-graphite shadow-[5px_5px_0_0_#1A1A1A] flex flex-col justify-between transition-transform duration-200 hover:-translate-y-1 relative"
          >
            {/* Imagem de Capa com Fita Adesiva e Badge */}
            <div className="relative w-full aspect-[16/10] overflow-hidden bg-gray-100 border-b-2 border-graphite">
              
              {/* Efeito de Fita Adesiva Translúcida no Topo */}
              <div 
                className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-5 bg-white/50 border border-white/60 shadow-sm backdrop-blur-[1px] rotate-1 z-20 pointer-events-none"
              />

              {/* Tag de Categoria (Preta no canto superior esquerdo) */}
              <span className="absolute top-3 left-3 bg-black/90 text-white font-mono text-[9px] sm:text-[10px] font-bold tracking-widest px-2.5 py-1 uppercase border border-white/20 z-20 select-none">
                {post.categoria}
              </span>

              {/* Foto da Capa */}
              <img
                src={post.imagem}
                alt={post.titulo}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </div>

            {/* Conteúdo do Card */}
            <div className="p-5 sm:p-6 flex flex-col flex-1">
              
              {/* Linha de Metadados: Autor e Tempo de Leitura */}
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3 font-sans">
                <div className="flex items-center gap-1.5 text-red-editorial font-bold font-sans truncate">
                  <User size={13} className="text-red-editorial flex-shrink-0" />
                  <span className="text-graphite font-bold truncate">{post.autor}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400 font-sans flex-shrink-0">
                  <Clock size={13} />
                  <span>{post.tempoLeitura}</span>
                </div>
              </div>

              {/* Título */}
              <Link to={`/post/${post.id}`}>
                <h3 className="font-serif font-bold text-xl sm:text-[22px] text-graphite leading-tight mb-3 line-clamp-2 hover:text-red-editorial transition-colors">
                  {post.titulo}
                </h3>
              </Link>

              {/* Resumo */}
              <p className="font-sans text-xs sm:text-sm text-gray-600 line-clamp-3 leading-relaxed mb-6 flex-1">
                {post.resumo}
              </p>

              {/* Rodapé do Card: Curtidas e Ler Mais */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-auto">
                <button
                  type="button"
                  onClick={(e) => handleLike(e, post.id, post.likes)}
                  className={`flex items-center gap-1.5 border px-3 py-1 rounded-sm text-xs font-mono font-bold transition-colors ${
                    likeInfo.liked
                      ? 'border-red-editorial text-red-editorial bg-red-50'
                      : 'border-graphite/40 text-graphite hover:border-red-editorial hover:text-red-editorial bg-white'
                  }`}
                  title="Curtir publicação"
                >
                  <Heart
                    size={13}
                    className={likeInfo.liked ? 'fill-red-editorial text-red-editorial' : ''}
                  />
                  <span>{likeInfo.count}</span>
                </button>

                <Link
                  to={`/post/${post.id}`}
                  className="font-mono text-xs font-bold uppercase tracking-wider text-graphite hover:text-red-editorial flex items-center gap-1 transition-colors"
                >
                  LER MAIS <ArrowRight size={13} />
                </Link>
              </div>

            </div>
          </article>
        );
      })}
    </div>
  );
};

export default PostsGrid;
