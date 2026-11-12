import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePost } from '../hooks/usePost';
import { ArrowLeft, User, Clock, Heart, Share2, Loader2, MessageCircle, Send, Sparkles } from 'lucide-react';
import { toggleLike, getLikeStatus, getComments, addComment } from '../services/api';
import Tape from '../components/ui/Tape';

const PostPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { post, loading, error } = usePost(id);

  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentError, setCommentError] = useState('');
  const [isLogged, setIsLogged] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const token = localStorage.getItem('plural_token');
    setIsLogged(!!token);
  }, [id]);

  // Carregar status da curtida e lista de comentários
  useEffect(() => {
    if (!id) return;

    // Busca status da curtida no banco
    getLikeStatus(id)
      .then((data) => {
        if (data) {
          setLiked(!!data.curtido);
          if (typeof data.likes === 'number') {
            setLikesCount(data.likes);
          }
        }
      })
      .catch((err) => {
        console.error('Erro ao buscar status de curtida:', err);
      });

    // Busca comentários reais no banco
    setLoadingComments(true);
    getComments(id)
      .then((data) => {
        setComments(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Erro ao carregar comentários:', err);
      })
      .finally(() => {
        setLoadingComments(false);
      });
  }, [id]);

  // Sincroniza contador caso o post já venha com likes
  useEffect(() => {
    if (post?.likes !== undefined && likesCount === 0) {
      setLikesCount(post.likes);
    }
  }, [post]);

  const handleLike = async () => {
    if (!isLogged) {
      alert('✧ Faça login para curtir e interagir com as publicações!');
      navigate('/login');
      return;
    }

    // Atualização otimista
    const prevLiked = liked;
    const prevLikes = likesCount;
    setLiked(!prevLiked);
    setLikesCount(prev => (prevLiked ? Math.max(0, prev - 1) : prev + 1));

    try {
      const res = await toggleLike(id);
      if (res && res.curtido !== undefined) {
        setLiked(res.curtido);
        setLikesCount(res.likes);
      }
    } catch (err) {
      console.error('Erro ao alternar curtida:', err);
      // Reverter se falhar
      setLiked(prevLiked);
      setLikesCount(prevLikes);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.titulo,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    if (!isLogged) {
      alert('✧ Faça login para deixar seu comentário!');
      navigate('/login');
      return;
    }

    setSubmittingComment(true);
    setCommentError('');

    try {
      const novoComentario = await addComment(id, commentText.trim());
      setComments(prev => [...prev, novoComentario]);
      setCommentText('');
    } catch (err) {
      setCommentError(err.response?.data?.mensagem || 'Erro ao enviar seu comentário. Tente novamente.');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 bg-[#F4F1EA]">
        <Loader2 size={36} className="animate-spin text-red-editorial mb-4" />
        <p className="font-mono text-xs uppercase tracking-widest text-gray-500">
          Carregando publicação... ✧
        </p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 bg-[#F4F1EA]">
        <div className="bg-red-editorial text-white font-mono text-xs font-bold uppercase tracking-widest px-4 py-1.5 mb-6 shadow-[2px_2px_0_0_#111111]">
          ERRO 404
        </div>
        <h2 className="font-serif font-black text-3xl sm:text-4xl text-graphite mb-4">
          Publicação não encontrada
        </h2>
        <p className="text-gray-600 max-w-md mb-8 font-sans text-sm">
          {error || "Este conteúdo não está disponível ou foi movido."}
        </p>
        <Link 
          to="/home" 
          className="inline-flex items-center gap-2 bg-graphite text-white text-xs font-mono font-bold uppercase tracking-wider px-6 py-3 rounded-sm hover:bg-black transition-colors"
        >
          <ArrowLeft size={15} /> VOLTAR PARA O FEED
        </Link>
      </div>
    );
  }

  const autorNome = post.autor || post.a || "Redação Lumina";
  const categoriaNome = post.categoria || "MODA & ESTILO";
  const tempoLeitura = post.tempoLeitura || "5 min de leitura";

  const dataFormatada = (() => {
    if (!post.criando_em) return 'Recentemente';
    const d = new Date(typeof post.criando_em === 'string' ? post.criando_em.replace(' ', 'T') : post.criando_em);
    return isNaN(d.getTime()) ? 'Recentemente' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  })();

  return (
    <div className="w-full bg-[#F4F1EA] min-h-screen py-10 sm:py-16">
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Barra Superior / Voltar */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-300">
          <Link 
            to="/home" 
            className="text-xs font-mono uppercase font-bold tracking-widest text-graphite hover:text-red-editorial transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft size={14} /> VOLTAR AO FEED
          </Link>

          <span className="text-[11px] font-mono tracking-widest text-gray-500 uppercase">
            ID: #{String(post.id).padStart(4, '0')}
          </span>
        </div>

        {/* Cabeçalho do Artigo */}
        <header className="mb-10 text-left">
          
          {/* Categoria com detalhe em Vermelho */}
          <div className="mb-4">
            <span className="bg-graphite text-white font-mono text-[10px] sm:text-xs font-bold tracking-widest px-3 py-1 uppercase inline-block border-2 border-graphite shadow-[3px_3px_0_0_#C8102E]">
              ✧ {categoriaNome}
            </span>
          </div>

          {/* Título Principal */}
          <h1 className="font-serif font-black text-3xl sm:text-4xl md:text-5xl text-graphite leading-[1.15] tracking-tight mb-6 break-words [overflow-wrap:anywhere]">
            {post.titulo}
          </h1>

          {/* Linha de Autor, Data e Leitura */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-sans text-gray-500 border-t border-b border-gray-200 py-3">
            <div className="flex items-center gap-1.5 text-red-editorial font-bold">
              <User size={14} className="text-red-editorial" />
              <span className="text-graphite">{autorNome}</span>
            </div>
            
            <span className="text-gray-300">•</span>

            <div className="flex items-center gap-1 text-gray-500">
              <Clock size={14} />
              <span>{tempoLeitura}</span>
            </div>

            <span className="text-gray-300">•</span>

            <span>Publicado em {dataFormatada}</span>
          </div>
        </header>

        {/* Imagem de Capa com moldura Polaroid/Scrapbook */}
        {post.imagem && (
          <div className="relative mb-12 bg-white border-2 border-graphite shadow-[6px_6px_0_0_#111111] p-2 sm:p-3">
            {/* Fita Adesiva Translúcida */}
            <Tape variant="yellow" className="-top-3 left-1/2 -translate-x-1/2 w-28 h-6 rotate-1 pointer-events-none" />

            <div className="overflow-hidden aspect-[16/9] w-full bg-gray-100">
              <img 
                src={post.imagem} 
                alt={post.titulo}
                className="w-full h-full object-cover" 
              />
            </div>
          </div>
        )}

        {/* Conteúdo do Artigo */}
        <div className="bg-white border-2 border-graphite p-6 sm:p-10 shadow-[4px_4px_0_0_#111111] mb-12 max-w-full overflow-hidden break-words [overflow-wrap:anywhere]">
          <div className="font-sans text-base sm:text-lg text-gray-800 leading-relaxed space-y-6 break-words [overflow-wrap:anywhere]">
            {typeof post.conteudo === 'string' && post.conteudo.split('\n\n').map((paragrafo, idx) => (
              <p key={idx} className="leading-relaxed break-words [overflow-wrap:anywhere] whitespace-pre-wrap">
                {paragrafo}
              </p>
            ))}
          </div>
        </div>

        {/* Barra de Ações (Curtir / Compartilhar / Voltar) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t-2 border-b-2 border-gray-300 mb-12">
          <div className="flex items-center gap-3">
            {/* Botão de Curtir com persistência real no MySQL */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 border-2 border-graphite px-5 py-2.5 rounded-sm text-xs font-mono font-bold transition-all shadow-[3px_3px_0_0_#111111] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#111111] ${
                liked
                  ? 'bg-red-editorial text-white border-graphite'
                  : 'bg-white text-graphite hover:text-red-editorial hover:border-red-editorial'
              }`}
              title={liked ? "Descurtir postagem" : "Curtir postagem"}
            >
              <Heart size={16} className={liked ? "fill-white text-white" : "text-red-editorial"} />
              <span>{likesCount} {likesCount === 1 ? 'CURTIDA' : 'CURTIDAS'} ✧</span>
            </button>

            {/* Botão de Compartilhar */}
            <button
              onClick={handleShare}
              className="flex items-center gap-2 border-2 border-graphite bg-white text-graphite hover:bg-red-50 hover:text-red-editorial px-4 py-2.5 rounded-sm text-xs font-mono font-bold transition-all shadow-[3px_3px_0_0_#111111]"
            >
              <Share2 size={15} />
              <span>{copiedLink ? 'LINK COPIADO! ✧' : 'COMPARTILHAR'}</span>
            </button>
          </div>

          <Link
            to="/home"
            className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-graphite hover:text-red-editorial transition-colors"
          >
            <ArrowLeft size={14} /> VOLTAR PARA O FEED
          </Link>
        </div>

        {/* ✦ SEÇÃO REDE SOCIAL: MURAL DE RECADOS / GIRL TALK (COMENTÁRIOS) ✦ */}
        <section className="bg-white border-2 border-graphite p-6 sm:p-8 shadow-[6px_6px_0_0_#C8102E] relative">
          {/* Fita Adesiva decorativa */}
          <Tape variant="yellow" className="-top-3 right-8 w-24 h-6 -rotate-2 pointer-events-none" />

          {/* Cabeçalho da Seção de Comentários */}
          <div className="flex items-center justify-between pb-4 border-b-2 border-graphite mb-6">
            <div className="flex items-center gap-2.5">
              <MessageCircle size={22} className="text-red-editorial" />
              <h3 className="font-serif font-black text-2xl text-graphite tracking-tight">
                Mural de Recados <span className="font-sans font-bold text-sm text-red-editorial">({comments.length})</span>
              </h3>
            </div>
            <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-red-editorial bg-red-50 px-3 py-1 border border-red-200 rounded-sm">
              ✧ Girl Talk
            </span>
          </div>

          {/* Lista de Comentários */}
          <div className="space-y-4 mb-8">
            {loadingComments ? (
              <div className="py-8 text-center text-gray-500 font-mono text-xs flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin text-red-editorial" />
                Carregando recados do mural...
              </div>
            ) : comments.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-gray-300 bg-gray-50 p-6 rounded-sm">
                <Sparkles size={24} className="mx-auto text-red-editorial mb-2" />
                <p className="font-serif font-bold text-graphite text-lg">Nenhum recado por aqui ainda!</p>
                <p className="font-sans text-xs text-gray-500 mt-1">
                  Seja a primeira a deixar uma mensagem no mural e compartilhar seus pensamentos. ✧
                </p>
              </div>
            ) : (
              comments.map((c) => {
                const commentDate = (() => {
                  if (!c.criado_em) return 'Recentemente';
                  const cd = new Date(typeof c.criado_em === 'string' ? c.criado_em.replace(' ', 'T') : c.criado_em);
                  return isNaN(cd.getTime()) ? 'Recentemente' : cd.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
                })();

                const initialLetter = (c.autor || 'U').charAt(0).toUpperCase();

                return (
                  <div 
                    key={c.id} 
                    className="border-2 border-graphite bg-[#FDFBF7] p-4 shadow-[3px_3px_0_0_#111111] transition-transform hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-editorial to-graphite border border-graphite text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs">
                          {initialLetter}
                        </div>
                        <div>
                          <span className="font-mono font-bold text-xs text-graphite block">
                            {c.autor || 'Usuária Anônima'}
                          </span>
                          <span className="font-mono text-[10px] text-gray-400">
                            {commentDate}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-red-editorial font-bold">✧</span>
                    </div>

                    <p className="font-sans text-sm text-gray-800 leading-relaxed pl-10 break-words [overflow-wrap:anywhere] whitespace-pre-wrap">
                      {c.texto}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Formulário de Envio de Comentário */}
          {isLogged ? (
            <form onSubmit={handleSubmitComment} className="border-t-2 border-gray-200 pt-6">
              <label htmlFor="comentario" className="block font-mono text-xs font-bold uppercase tracking-wider text-graphite mb-2">
                Deixe seu recadinho no mural:
              </label>

              {commentError && (
                <div className="bg-red-100 border border-red-400 text-red-700 text-xs p-2.5 mb-3 font-mono">
                  {commentError}
                </div>
              )}

              <div className="relative mb-3">
                <textarea
                  id="comentario"
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escreva sua opinião, dica ou recado para a autora... ✧"
                  className="w-full border-2 border-graphite p-3 text-sm font-sans focus:outline-hidden focus:border-red-editorial focus:ring-2 focus:ring-red-100 resize-none bg-white"
                  maxLength={500}
                />
                <span className="absolute bottom-2.5 right-3 text-[10px] font-mono text-gray-400">
                  {commentText.length}/500
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[11px] font-sans text-gray-500 italic">
                  Compartilhe suas ideias de forma respeitosa e acolhedora ✧
                </span>
                <button
                  type="submit"
                  disabled={submittingComment || !commentText.trim()}
                  className="inline-flex items-center gap-2 bg-red-editorial hover:bg-black text-white font-mono text-xs uppercase font-bold tracking-widest px-5 py-2.5 border-2 border-graphite shadow-[3px_3px_0_0_#111111] hover:shadow-[1px_1px_0_0_#111111] hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {submittingComment ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> ENVIANDO...
                    </>
                  ) : (
                    <>
                      <Send size={14} /> PUBLICAR RECADO ✧
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="border-2 border-dashed border-red-200 bg-red-50/40 p-6 text-center">
              <h4 className="font-serif font-bold text-graphite text-base mb-1">
                Quer participar do mural de recados? ✧
              </h4>
              <p className="font-sans text-xs text-gray-600 mb-4">
                Faça login na sua conta para deixar comentários, trocar ideias e interagir com outras leitoras!
              </p>
              <Link
                to="/login"
                className="inline-block bg-red-editorial text-white font-mono text-xs uppercase font-bold tracking-widest px-6 py-2.5 border-2 border-graphite shadow-[3px_3px_0_0_#111111] hover:bg-black transition-all"
              >
                ENTRAR NA MINHA CONTA ✧
              </Link>
            </div>
          )}
        </section>

      </article>
    </div>
  );
};

export default PostPage;
