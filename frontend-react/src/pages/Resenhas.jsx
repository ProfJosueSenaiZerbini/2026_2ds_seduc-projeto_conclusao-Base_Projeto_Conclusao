import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePosts } from '../hooks/usePosts';
import { Clock, User, ArrowRight, MessageCircle } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Sparkle from '../components/ui/Sparkle';
import CommentsModal from '../components/comments/CommentsModal';

const CATEGORIES = ['TODAS', 'MODA & ESTILO', 'CINEMA & TV', 'LITERATURA', 'MÚSICA', 'BEM-ESTAR'];

const Resenhas = () => {
  const navigate = useNavigate();
  const { posts, loading, error } = usePosts();
  const [selectedCategory, setSelectedCategory] = useState('TODAS');
  const [modalComentariosAberto, setModalComentariosAberto] = useState(false);
  const [postParaComentar, setPostParaComentar] = useState(null);
  const [comentariosExtras, setComentariosExtras] = useState({});

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Mapeia exclusivamente os posts reais do banco de dados
  const allPosts = (posts && posts.length > 0)
    ? posts.map((p) => ({
        id: p.id,
        titulo: p.titulo,
        categoria: p.categoria || 'MODA & ESTILO',
        autor: p.autor || 'Membro da Comunidade',
        tempoLeitura: p.tempoLeitura || '5 min de leitura',
        resumo: p.resumo || (p.conteudo ? p.conteudo.substring(0, 160) + '...' : 'Sem resumo disponível.'),
        imagem: p.imagem || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=400&fit=crop',
        total_comentarios: p.total_comentarios || 0
      }))
    : [];

  // Normalizador e filtro por categoria resiliente e bidirecional
  const normalizar = (str = '') =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();

  const filteredPosts = allPosts.filter(post => {
    if (selectedCategory === 'TODAS') return true;
    const cat = normalizar(post.categoria || '');
    const sel = normalizar(selectedCategory);

    if (cat === sel || cat.includes(sel) || sel.includes(cat)) return true;
    if ((sel.includes('CINEMA') || sel.includes('FILME')) && (cat.includes('CINEMA') || cat.includes('FILME'))) return true;
    if ((sel.includes('LIVRO') || sel.includes('LITERATURA')) && (cat.includes('LIVRO') || cat.includes('LITERATURA'))) return true;
    if ((sel.includes('MODA') || sel.includes('ESTILO')) && (cat.includes('MODA') || cat.includes('ESTILO'))) return true;
    if (sel.includes('MUSICA') && cat.includes('MUSICA')) return true;
    if (sel.includes('TEATRO') && cat.includes('TEATRO')) return true;
    if ((sel.includes('BEM-ESTAR') || sel.includes('COTIDIANO')) && (cat.includes('BEM-ESTAR') || cat.includes('COTIDIANO'))) return true;
    return false;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">

      {/* Cabeçalho da Seção de Resenhas */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-graphite pb-6 mb-10 gap-6 relative">
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
        <div className="py-20 text-center font-mono text-xs uppercase tracking-widest text-gray-500">
          Carregando resenhas do banco de dados... ✧
        </div>
      )}

      {/* Estado: Erro */}
      {error && !loading && allPosts.length === 0 && (
        <div className="py-16 text-center">
          <h3 className="font-serif text-2xl font-bold text-graphite mb-2">Não foi possível carregar as resenhas do servidor</h3>
          <p className="text-gray-editorial text-sm mb-6">{error}</p>
        </div>
      )}

      {/* Grid de Postagens */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => {
              return (
                <article
                  key={post.id}
                  onClick={() => navigate(`/post/${post.id}`)}
                  className="bg-cream-light border-2 border-graphite flex flex-col justify-between shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(200,16,46,1)] transition-all duration-200 relative cursor-pointer group"
                >
                  <div>
                    {/* Imagem de Capa do Post */}
                    <div className="relative aspect-[16/10] overflow-hidden border-b-2 border-graphite bg-gray-100">
                      <img
                        src={post.imagem}
                        alt={post.titulo}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      {/* Tag / Categoria em destaque */}
                      <span className="absolute top-3 left-3 bg-graphite text-white font-mono text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 border border-white shadow-xs">
                        ✧ {post.categoria}
                      </span>
                    </div>

                    {/* Conteúdo textual do Card */}
                    <div className="p-6 flex flex-col flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 text-xs font-mono text-gray-editorial mb-3 pb-3 border-b border-gray-300/60 min-w-0">
                        <span className="flex items-center gap-1.5 font-bold text-graphite min-w-0 truncate">
                          <User size={13} className="text-red-editorial flex-shrink-0" />
                          <span className="truncate">{post.autor}</span>
                        </span>
                        <span className="flex items-center gap-1 text-[11px] flex-shrink-0 text-gray-500">
                          <Clock size={12} /> {post.tempoLeitura}
                        </span>
                      </div>

                      <h2 className="font-serif font-bold text-xl sm:text-2xl text-graphite leading-snug mb-3 group-hover:text-red-editorial transition-colors line-clamp-2 break-words">
                        {post.titulo}
                      </h2>

                      <p className="font-sans text-sm text-gray-600 leading-relaxed line-clamp-3 break-words">
                        {post.resumo}
                      </p>
                    </div>
                  </div>

                  {/* Rodapé do Card */}
                  <div className="p-6 pt-0 border-t border-gray-200 mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPostParaComentar(post);
                          setModalComentariosAberto(true);
                        }}
                        className="flex items-center gap-1.5 text-xs font-mono font-bold text-gray-700 hover:text-red-editorial bg-white hover:bg-red-50 border border-gray-300 hover:border-red-editorial px-2.5 py-1.5 shadow-xs transition-all cursor-pointer group"
                        title="Abrir comentários ✧"
                      >
                        <MessageCircle size={13} className="text-gray-500 group-hover:text-red-editorial transition-colors" />
                        <span>{comentariosExtras[post.id] !== undefined ? comentariosExtras[post.id] : (post.total_comentarios || 0)}</span>
                      </button>
                    </div>

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
              <p className="font-mono text-xs uppercase tracking-widest text-gray-500">
                {allPosts.length === 0
                  ? 'Nenhuma resenha cadastrada no banco de dados ainda.'
                  : `Nenhuma resenha encontrada para a categoria "${selectedCategory}".`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ✦ MODAL DE COMENTÁRIOS ESTILO INSTAGRAM ✦ */}
      <CommentsModal
        isOpen={modalComentariosAberto}
        onClose={() => {
          setModalComentariosAberto(false);
          setPostParaComentar(null);
        }}
        post={postParaComentar}
        onCommentAdded={(novoTotal) => {
          if (postParaComentar) {
            setComentariosExtras((prev) => ({
              ...prev,
              [postParaComentar.id]: novoTotal
            }));
          }
        }}
      />

    </div>
  );
};

export default Resenhas;
