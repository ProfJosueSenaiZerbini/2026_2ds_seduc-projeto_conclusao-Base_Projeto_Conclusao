import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, User, ArrowRight, MessageCircle } from 'lucide-react';
import Badge from '../components/ui/Badge';
import CommentsModal from '../components/comments/CommentsModal';
import { usePosts } from '../hooks/usePosts';

const Home = () => {
  const navigate = useNavigate();
  const { posts: dbPosts, loading } = usePosts();
  const [postsList, setPostsList] = useState([]);
  const [modalComentariosAberto, setModalComentariosAberto] = useState(false);
  const [postParaComentar, setPostParaComentar] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Carrega única e exclusivamente as publicações reais do banco de dados
  useEffect(() => {
    if (dbPosts) {
      const formatados = dbPosts.map((p) => ({
        id: p.id,
        titulo: p.titulo,
        categoria: p.categoria || 'Moda & Estilo',
        autor: p.autor || 'Membro da Comunidade',
        data: p.criando_em ? new Date(p.criando_em).toLocaleDateString('pt-BR') : 'Recentemente',
        tempoLeitura: p.tempoLeitura || '5 min de leitura',
        resumo: p.resumo || (p.conteudo ? p.conteudo.substring(0, 150) + '...' : 'Sem resumo disponível.'),
        imagem: p.imagem || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=400&fit=crop',
        total_comentarios: p.total_comentarios || 0
      }));
      setPostsList(formatados);
    }
  }, [dbPosts]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">

      {/* ✦ CABEÇALHO DO FEED PRINCIPAL ✦ */}
      <div className="border-b-2 border-graphite pb-8 mb-12 relative">
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
          Navegue pelas publicações da nossa rede: artigos, resenhas de cinema, leituras, reflexões
          e discussões criadas pela nossa comunidade.
        </p>
      </div>

      {/* ✦ GRID DE POSTAGENS REAIS ✦ */}
      {loading ? (
        <div className="py-24 text-center font-mono text-xs uppercase tracking-widest text-gray-500">
          Carregando publicações reais da rede... ✧
        </div>
      ) : postsList.length === 0 ? (
        <div className="border-2 border-dashed border-graphite p-12 text-center bg-cream-light shadow-[4px_4px_0_0_#111111]">
          <h3 className="font-serif font-black text-2xl text-graphite mb-2">
            Nenhuma publicação cadastrada
          </h3>
          <p className="font-sans text-sm text-gray-600 mb-6 max-w-md mx-auto">
            Ainda não há posts criados na revista. Seja a primeira a publicar!
          </p>
          <Link
            to="/novoPost"
            className="inline-flex items-center gap-2 bg-red-editorial text-white font-mono text-xs uppercase font-bold tracking-widest px-6 py-3.5 border border-transparent hover:bg-black transition-colors"
          >
            <span>CRIAR PRIMEIRO POST</span> ✧
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
          {postsList.map((post) => {
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

                {/* Rodapé do Card: Ações (Comentários & Ler Mais) */}
                <div className="p-6 pt-0 border-t border-gray-200 mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Botão de Comentários Interativo */}
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
                      <span>{post.total_comentarios || 0}</span>
                    </button>
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
            setPostsList((prev) =>
              prev.map((p) =>
                p.id === postParaComentar.id ? { ...p, total_comentarios: novoTotal } : p
              )
            );
          }
        }}
      />

    </div>
  );
};

export default Home;
