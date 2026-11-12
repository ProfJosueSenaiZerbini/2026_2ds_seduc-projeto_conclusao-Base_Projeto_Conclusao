import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePosts } from '../hooks/usePosts';
import { Heart, Clock, User, ArrowRight, MessageCircle } from 'lucide-react';
import Tape from '../components/ui/Tape';
import Badge from '../components/ui/Badge';
import Sparkle from '../components/ui/Sparkle';
import { toggleLike } from '../services/api';

const CATEGORIES = ['TODAS', 'MODA & ESTILO', 'CINEMA & TV', 'LITERATURA', 'MÚSICA', 'BEM-ESTAR'];

const POSTS_PADRAO = [
  {
    id: 1,
    titulo: 'O Retorno Triunfal da Estética Y2K: Nostalgia, Moda e Redes',
    categoria: 'MODA & ESTILO',
    autor: 'Juliana Mendes',
    tempoLeitura: '5 min de leitura',
    resumo: 'Como as tendências dos anos 2000 — do brilho labial aos jeans cintura baixa — voltaram com força total na cultura pop contemporânea.',
    imagem: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=400&fit=crop',
    curtidas: 42,
    total_comentarios: 6
  },
  {
    id: 2,
    titulo: 'Girlhood no Cinema: Filmes Clássicos dos Anos 2000 que Marcaram Gerações',
    categoria: 'CINEMA & TV',
    autor: 'Beatriz Vasconcelos',
    tempoLeitura: '8 min de leitura',
    resumo: 'De Meninas Malvadas a Legalmente Loira: como essas produções moldaram a nossa percepção sobre amizade feminina, moda e autoexpressão.',
    imagem: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=400&fit=crop',
    curtidas: 89,
    total_comentarios: 14
  },
  {
    id: 3,
    titulo: 'Elogio à Lentidão: Como Redescobrir o Prazer do Diário e do Autocuidado',
    categoria: 'BEM-ESTAR',
    autor: 'Camila Duarte',
    tempoLeitura: '4 min de leitura',
    resumo: 'Em uma rotina acelerada, resgatar pequenos rituais sem telas como scrapbook, journaling e momentos de chá é essencial para a mente.',
    imagem: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&h=400&fit=crop',
    curtidas: 65,
    total_comentarios: 4
  },
  {
    id: 4,
    titulo: 'Livros de Autoras Contemporâneas que Você Precisa Ler Este Ano',
    categoria: 'LITERATURA',
    autor: 'Mariana Sales',
    tempoLeitura: '7 min de leitura',
    resumo: 'Uma curadoria especial de romances e ensaios escritos por mulheres que retratam os desafios, os afetos e os encontros modernos.',
    imagem: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=400&fit=crop',
    curtidas: 112,
    total_comentarios: 19
  },
  {
    id: 5,
    titulo: 'Playlist Nostalgia: Os Ícones Pop Femininos que Definiram a Década de 2000',
    categoria: 'MÚSICA',
    autor: 'Larissa Moura',
    tempoLeitura: '6 min de leitura',
    resumo: 'Relembre as batidas contagiantes do R&B e do pop que embalaram os tocadores de MP3 e continuam na ponta da língua até hoje.',
    imagem: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=400&fit=crop',
    curtidas: 73,
    total_comentarios: 8
  },
  {
    id: 6,
    titulo: 'Design, Colagens e Scrapbooks: O Resgate do Artesanal no Meio Digital',
    categoria: 'MODA & ESTILO',
    autor: 'Fernanda Lima',
    tempoLeitura: '9 min de leitura',
    resumo: 'A estética DIY das fanzines e dos adesivos encontrou um novo lar na internet, inspirando criadoras a produzir peças afetivas.',
    imagem: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&h=400&fit=crop',
    curtidas: 54,
    total_comentarios: 5
  }
];

const Resenhas = () => {
  const navigate = useNavigate();
  const { posts, loading, error } = usePosts();
  const [selectedCategory, setSelectedCategory] = useState('TODAS');
  const [postsCurtidos, setPostsCurtidos] = useState({});

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const alternarCurtida = async (id) => {
    const token = localStorage.getItem('plural_token');
    setPostsCurtidos(prev => ({ ...prev, [id]: !prev[id] }));

    if (token) {
      try {
        await toggleLike(id);
      } catch (e) {
        console.error('Erro ao curtir no backend:', e);
      }
    }
  };

  // Se houver posts no banco, usa os posts reais; senão, complementa com os padrões da Home
  const allPosts = (posts && posts.length > 0)
    ? posts.map((p, idx) => ({
        id: p.id,
        titulo: p.titulo,
        categoria: p.categoria || 'MODA & ESTILO',
        autor: p.autor || 'Redação Plural',
        tempoLeitura: p.tempoLeitura || '5 min de leitura',
        resumo: p.resumo || (p.conteudo ? p.conteudo.substring(0, 160) + '...' : 'Sem resumo disponível.'),
        imagem: p.imagem || POSTS_PADRAO[idx % POSTS_PADRAO.length].imagem,
        curtidas: p.likes !== undefined ? p.likes : (p.curtidas || (40 + ((p.id * 7) % 60))),
        total_comentarios: p.total_comentarios || 0
      }))
    : POSTS_PADRAO;

  // Filtro por categoria
  const filteredPosts = allPosts.filter(post => {
    if (selectedCategory === 'TODAS') return true;
    const cat = (post.categoria || '').toUpperCase();
    return cat.includes(selectedCategory);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      
      {/* Cabeçalho da Seção de Resenhas */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-graphite pb-6 mb-10 gap-6 relative">
        <Tape variant="yellow" className="-top-3 right-6 w-24 h-6 rotate-1 pointer-events-none" />

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">CATÁLOGO EDITORIAL</Badge>
            <Sparkle className="text-red-editorial text-xs" />
          </div>
          <h1 className="font-serif font-black text-4xl sm:text-5xl text-graphite tracking-tight">
            Feed de <span className="italic text-red-editorial">Resenhas & Artigos</span>
          </h1>
          <p className="font-sans text-sm text-gray-500 mt-2 max-w-xl">
            Críticas, ensaios e opiniões da nossa comunidade sobre cinema, livros, estilo e cultura contemporânea.
          </p>
        </div>

        {/* Abas de Filtro de Categoria */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 font-mono text-[10px] uppercase font-bold tracking-widest border transition-all ${
                selectedCategory === cat
                  ? 'bg-graphite text-white border-graphite shadow-[2px_2px_0_0_#C8102E]'
                  : 'bg-white text-graphite border-gray-300 hover:border-graphite hover:text-red-editorial'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Estado: Carregando (Loading) */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="bg-cream-light border-2 border-graphite p-6 space-y-4 animate-pulse">
              <div className="w-full aspect-[16/10] bg-gray-300/60" />
              <div className="h-4 bg-gray-300/60 w-1/3" />
              <div className="h-6 bg-gray-300/60 w-3/4" />
              <div className="h-16 bg-gray-300/60 w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Estado: Erro */}
      {error && !loading && posts.length === 0 && (
        <div className="py-16 text-center">
          <h3 className="font-serif text-2xl font-bold text-graphite mb-2">Não foi possível carregar as resenhas do servidor</h3>
          <p className="text-gray-editorial text-sm mb-6">{error}</p>
        </div>
      )}

      {/* Grid de Postagens no mesmo estilo da Home */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post, index) => {
              const foiCurtido = !!postsCurtidos[post.id];
              const totalCurtidas = post.curtidas + (foiCurtido ? 1 : 0);

              return (
                <article
                  key={post.id}
                  onClick={() => navigate(`/post/${post.id}`)}
                  className="bg-cream-light border-2 border-graphite flex flex-col justify-between shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(200,16,46,1)] transition-all duration-200 relative cursor-pointer group"
                >
                  {/* Fitas adesivas */}
                  {index % 3 === 0 && (
                    <Tape variant="yellow" className="-top-3 left-6 w-24 h-6 rotate-1 pointer-events-none" />
                  )}
                  {index % 3 === 1 && (
                    <Tape variant="blue" className="-top-3 right-6 w-20 h-5 -rotate-2 pointer-events-none" />
                  )}

                  <div>
                    {/* Imagem de Capa do Post */}
                    <div className="relative aspect-[16/10] overflow-hidden border-b-2 border-graphite bg-gray-100">
                      <img
                        src={post.imagem}
                        alt={post.titulo}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      {/* Tag / Categoria em destaque sobreposta */}
                      <span className="absolute top-3 left-3 bg-graphite text-white font-mono text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 border border-white shadow-xs">
                        ✧ {post.categoria}
                      </span>
                    </div>

                    {/* Conteúdo textual do Card */}
                    <div className="p-6 flex flex-col flex-1 min-w-0">
                      {/* Metadados: Autor e Tempo de Leitura */}
                      <div className="flex items-center justify-between gap-2 text-xs font-mono text-gray-editorial mb-3 pb-3 border-b border-gray-300/60 min-w-0">
                        <span className="flex items-center gap-1.5 font-bold text-graphite min-w-0 truncate">
                          <User size={13} className="text-red-editorial flex-shrink-0" />
                          <span className="truncate">{post.autor}</span>
                        </span>
                        <span className="flex items-center gap-1 text-[11px] flex-shrink-0 text-gray-500">
                          <Clock size={12} /> {post.tempoLeitura}
                        </span>
                      </div>

                      {/* Título do Post */}
                      <h2 className="font-serif font-bold text-xl sm:text-2xl text-graphite leading-snug mb-3 group-hover:text-red-editorial transition-colors line-clamp-2 break-words">
                        {post.titulo}
                      </h2>

                      {/* Resumo / Trecho */}
                      <p className="font-sans text-sm text-gray-600 leading-relaxed line-clamp-3 break-words">
                        {post.resumo}
                      </p>
                    </div>
                  </div>

                  {/* Rodapé do Card: Ações (Curtir, Comentários & Ler Mais) */}
                  <div className="p-6 pt-0 border-t border-gray-200 mt-2 flex items-center justify-between">
                    
                    <div className="flex items-center gap-2">
                      {/* Botão de Curtir com contador e estado reativo */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          alternarCurtida(post.id);
                        }}
                        className={`flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-1.5 border transition-all ${
                          foiCurtido
                            ? 'bg-red-editorial text-white border-red-editorial shadow-[2px_2px_0_0_#111111]'
                            : 'bg-white text-graphite border-graphite hover:border-red-editorial hover:text-red-editorial'
                        }`}
                        title="Curtir postagem"
                      >
                        <Heart
                          size={14}
                          className={foiCurtido ? 'fill-white text-white' : 'text-red-editorial'}
                        />
                        <span>{totalCurtidas}</span>
                      </button>

                      {/* Badge de Comentários */}
                      <span 
                        className="flex items-center gap-1 text-xs font-mono font-bold text-gray-600 bg-white border border-gray-300 px-2 py-1.5 shadow-xs"
                        title="Total de recados"
                      >
                        <MessageCircle size={13} className="text-gray-500" />
                        <span>{post.total_comentarios || 0}</span>
                      </span>
                    </div>

                    {/* Botão de Ler Mais */}
                    <Link
                      to={`/post/${post.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest font-bold text-graphite hover:text-red-editorial group-hover:text-red-editorial transition-colors"
                    >
                      <span>Ler mais</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>

                  </div>
                </article>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center">
              <p className="font-mono text-xs uppercase tracking-widest text-gray-400">
                Nenhuma resenha encontrada para a categoria "{selectedCategory}".
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Resenhas;
