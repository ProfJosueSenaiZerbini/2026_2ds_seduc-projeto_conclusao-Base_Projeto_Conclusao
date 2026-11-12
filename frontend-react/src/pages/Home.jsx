import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Clock, User, ArrowRight, MessageCircle, Sparkles } from 'lucide-react';
import Tape from '../components/ui/Tape';
import Badge from '../components/ui/Badge';
import { usePosts } from '../hooks/usePosts';
import { toggleLike } from '../services/api';

// ✦ Dados padrão caso a base ainda não tenha publicações
const POSTS_INICIAIS = [
  {
    id: 1,
    titulo: 'O Retorno Triunfal da Estética Y2K: Nostalgia, Moda e Redes',
    categoria: 'Moda & Estilo',
    autor: 'Juliana Mendes',
    data: '15 de Outubro, 2026',
    tempoLeitura: '5 min de leitura',
    resumo: 'Como as tendências dos anos 2000 — do brilho labial aos jeans cintura baixa — voltaram com força total e ressignificadas na cultura digital.',
    imagem: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=400&fit=crop',
    curtidas: 42,
    total_comentarios: 6
  },
  {
    id: 2,
    titulo: 'Girlhood no Cinema: Filmes Clássicos dos Anos 2000 que Marcaram Gerações',
    categoria: 'Cinema & TV',
    autor: 'Beatriz Vasconcelos',
    data: '14 de Outubro, 2026',
    tempoLeitura: '8 min de leitura',
    resumo: 'De Meninas Malvadas a Legalmente Loira: como essas produções moldaram a nossa percepção sobre amizade feminina, moda e autoexpressão.',
    imagem: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&h=400&fit=crop',
    curtidas: 89,
    total_comentarios: 14
  },
  {
    id: 3,
    titulo: 'Elogio à Lentidão: Como Redescobrir o Prazer do Diário e do Autocuidado',
    categoria: 'Bem-Estar',
    autor: 'Camila Duarte',
    data: '12 de Outubro, 2026',
    tempoLeitura: '4 min de leitura',
    resumo: 'Em uma rotina acelerada, resgatar pequenos rituais sem telas como scrapbook, journaling e momentos de autocuidado é essencial para a mente.',
    imagem: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&h=400&fit=crop',
    curtidas: 65,
    total_comentarios: 4
  },
  {
    id: 4,
    titulo: 'Livros de Autoras Contemporâneas que Você Precisa Ler Este Ano',
    categoria: 'Literatura',
    autor: 'Mariana Sales',
    data: '10 de Outubro, 2026',
    tempoLeitura: '7 min de leitura',
    resumo: 'Uma curadoria especial de romances e crônicas escritos por mulheres que retratam os desafios, os afetos e os encontros modernos.',
    imagem: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=400&fit=crop',
    curtidas: 112,
    total_comentarios: 19
  },
  {
    id: 5,
    titulo: 'Playlist Nostalgia: Os Ícones Pop Femininos que Definiram a Década de 2000',
    categoria: 'Música',
    autor: 'Larissa Moura',
    data: '08 de Outubro, 2026',
    tempoLeitura: '6 min de leitura',
    resumo: 'Relembre as batidas contagiantes do R&B e do pop que embalaram os tocadores de MP3 e continuam na ponta da língua até hoje.',
    imagem: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=400&fit=crop',
    curtidas: 73,
    total_comentarios: 8
  },
  {
    id: 6,
    titulo: 'Design, Colagens e Scrapbooks: O Resgate do Artesanal no Meio Digital',
    categoria: 'Criatividade',
    autor: 'Fernanda Lima',
    data: '05 de Outubro, 2026',
    tempoLeitura: '9 min de leitura',
    resumo: 'A estética DIY das fanzines e dos adesivos encontrou um novo lar na internet, inspirando designers a criar interfaces mais lúdicas e afetivas.',
    imagem: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&h=400&fit=crop',
    curtidas: 54,
    total_comentarios: 5
  }
];

const Home = () => {
  const navigate = useNavigate();
  const { posts: dbPosts } = usePosts();
  const [postsList, setPostsList] = useState(POSTS_INICIAIS);
  const [postsCurtidos, setPostsCurtidos] = useState({});

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Sincroniza com os posts vindos do banco de dados quando disponíveis
  useEffect(() => {
    if (dbPosts && dbPosts.length > 0) {
      const formatados = dbPosts.map((p, idx) => ({
        id: p.id,
        titulo: p.titulo,
        categoria: p.categoria || 'Moda & Estilo',
        autor: p.autor || 'Membro da Comunidade',
        data: p.criando_em ? new Date(p.criando_em).toLocaleDateString('pt-BR') : 'Recentemente',
        tempoLeitura: p.tempoLeitura || '5 min de leitura',
        resumo: p.resumo || (p.conteudo ? p.conteudo.substring(0, 150) + '...' : 'Sem resumo disponível.'),
        imagem: p.imagem || POSTS_INICIAIS[idx % POSTS_INICIAIS.length].imagem,
        curtidas: p.likes !== undefined ? p.likes : (p.curtidas || 40),
        total_comentarios: p.total_comentarios || 0
      }));
      setPostsList(formatados);
    }
  }, [dbPosts]);

  // Função para gerenciar a curtida de cada post com persistência
  const alternarCurtida = async (id) => {
    const token = localStorage.getItem('plural_token');
    const jaCurtiu = !!postsCurtidos[id];
    setPostsCurtidos(prev => ({ ...prev, [id]: !jaCurtiu }));

    setPostsList(prevPosts =>
      prevPosts.map(post => {
        if (post.id === id) {
          const currentCount = post.curtidas || post.likes || 0;
          return {
            ...post,
            curtidas: jaCurtiu ? Math.max(0, currentCount - 1) : currentCount + 1,
            likes: jaCurtiu ? Math.max(0, currentCount - 1) : currentCount + 1
          };
        }
        return post;
      })
    );

    if (token) {
      try {
        await toggleLike(id);
      } catch (e) {
        console.error('Erro ao curtir no backend:', e);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      
      {/* ✦ CABEÇALHO DO FEED PRINCIPAL ✦ */}
      <div className="border-b-2 border-graphite pb-8 mb-12 relative">
        <Tape variant="yellow" className="-top-3 right-4 w-28 h-6 rotate-2 pointer-events-none" />
        
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="filled">COMUNIDADE & BLOG EDITORIAL</Badge>
          <span className="font-mono text-xs uppercase tracking-widest text-red-editorial font-bold">
            ✧ FEED COLETIVO · ARTIGOS & RESENHAS ✧
          </span>
        </div>
        
        <h1 className="font-serif font-black text-4xl sm:text-6xl text-graphite tracking-tight leading-none mb-4">
          Conexão, Estilo & <br />
          <span className="italic text-red-editorial">Perspectivas Plurais</span>.
        </h1>
        
        <p className="font-sans text-base text-gray-editorial max-w-2xl leading-relaxed">
          Navegue pelas últimas publicações da nossa rede: artigos, resenhas de cinema, leituras, reflexões 
          e discussões criadas pela nossa comunidade.
        </p>
      </div>

      {/* ✦ GRID DE POSTAGENS VARIADAS ✦ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
        {postsList.map((post, index) => {
          const foiCurtido = !!postsCurtidos[post.id];

          return (
            <article
              key={post.id}
              onClick={() => navigate(`/post/${post.id}`)}
              className="bg-cream-light border-2 border-graphite flex flex-col justify-between shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(200,16,46,1)] transition-all duration-200 relative cursor-pointer group"
            >
              {/* Fitas adesivas com estética retrô */}
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
                    <span>{post.curtidas || post.likes || 0}</span>
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
        })}
      </div>

    </div>
  );
};

export default Home;
