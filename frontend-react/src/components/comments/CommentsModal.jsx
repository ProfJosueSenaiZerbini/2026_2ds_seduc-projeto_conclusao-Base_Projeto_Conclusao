import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Send, Heart, MessageCircle, Loader2, Sparkles, User } from 'lucide-react';
import { getComments, addComment } from '../../services/api';
import Tape from '../ui/Tape';

// Formatação amigável de data/tempo relativo
const formatarTempo = (dataRaw) => {
  if (!dataRaw) return 'agora';
  const data = new Date(dataRaw);
  if (isNaN(data.getTime())) return 'recentemente';

  const agora = new Date();
  const diffSegundos = Math.floor((agora - data) / 1000);

  if (diffSegundos < 60) return 'agora';
  const diffMinutos = Math.floor(diffSegundos / 60);
  if (diffMinutos < 60) return `${diffMinutos} min`;
  const diffHoras = Math.floor(diffMinutos / 60);
  if (diffHoras < 24) return `${diffHoras} h`;
  const diffDias = Math.floor(diffHoras / 24);
  if (diffDias < 7) return `${diffDias} d`;

  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

// Comentários padrão para posts iniciais/mock caso o banco ainda não os tenha
const MOCK_COMMENTS_PADRAO = {
  1: [
    { id: 'm1', autor: 'Camila Duarte', texto: 'A estética Y2K traz tanta nostalgia! Esse ensaio capturou perfeitamente o espírito da época ✧', criado_em: new Date(Date.now() - 3600000 * 5) },
    { id: 'm2', autor: 'Beatriz Vasconcelos', texto: 'Amei as referências de estilo! Quero ver mais textos sobre isso.', criado_em: new Date(Date.now() - 3600000 * 2) }
  ],
  2: [
    { id: 'm3', autor: 'Juliana Mendes', texto: 'Meninas Malvadas é um clássico atemporal. Análise incrível!', criado_em: new Date(Date.now() - 3600000 * 8) }
  ]
};

const QUICK_EMOJIS = ['❤️', '✨', '👏', '😍', '✍️', '☕', '🔥'];

const CommentsModal = ({ isOpen, onClose, post, onCommentAdded }) => {
  const navigate = useNavigate();
  const [comentarios, setComentarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [novoComentario, setNovoComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [comentariosCurtidos, setComentariosCurtidos] = useState({});
  const commentsEndRef = useRef(null);
  const inputRef = useRef(null);

  // Usuário autenticado
  const userRaw = localStorage.getItem('plural_user');
  const token = localStorage.getItem('plural_token');
  const userLogado = userRaw ? JSON.parse(userRaw) : null;
  const isLogged = !!token;

  // Fecha com ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  // Carrega comentários ao abrir
  useEffect(() => {
    if (!isOpen || !post?.id) return;

    setLoading(true);
    setErro('');
    setNovoComentario('');

    getComments(post.id)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setComentarios(data);
        } else {
          // Fallback para posts de exemplo/mock
          const mock = MOCK_COMMENTS_PADRAO[post.id] || [];
          setComentarios(mock);
        }
      })
      .catch((err) => {
        console.warn('Erro ao carregar comentários via API, usando fallback:', err);
        const mock = MOCK_COMMENTS_PADRAO[post.id] || [];
        setComentarios(mock);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, post?.id]);

  // Foco no input ao abrir
  useEffect(() => {
    if (isOpen && !loading && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, loading]);

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const textoLimpo = novoComentario.trim();
    if (!textoLimpo || enviando) return;

    if (!isLogged) {
      alert('✧ Você precisa fazer login para publicar um comentário!');
      navigate('/login');
      return;
    }

    setEnviando(true);
    setErro('');

    try {
      let comentarioCriado = null;
      try {
        comentarioCriado = await addComment(post.id, textoLimpo);
      } catch (apiErr) {
        console.warn('API de comentário falhou, simulando localmente:', apiErr);
      }

      const comentarioFinal = comentarioCriado || {
        id: 'local-' + Date.now(),
        texto: textoLimpo,
        criado_em: new Date().toISOString(),
        usuario_id: userLogado?.id || '1',
        autor: userLogado?.nome || 'Você',
        autor_foto: userLogado?.foto || ''
      };

      const novos = [...comentarios, comentarioFinal];
      setComentarios(novos);
      setNovoComentario('');

      // Notifica o componente pai para atualizar a contagem do post
      if (onCommentAdded) {
        onCommentAdded(novos.length);
      }

      setTimeout(scrollToBottom, 100);
    } catch (err) {
      setErro('Não foi possível enviar o comentário. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  const handleEmojiClick = (emoji) => {
    setNovoComentario((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const toggleCurtidaComentario = (comentarioId) => {
    setComentariosCurtidos((prev) => ({
      ...prev,
      [comentarioId]: !prev[comentarioId]
    }));
  };

  if (!isOpen || !post) return null;

  return (
    <div 
      className="fixed inset-0 z-[150] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white border-2 border-graphite w-full max-w-lg md:max-w-xl h-[88vh] max-h-[680px] flex flex-col shadow-[8px_8px_0_0_#111111] relative rounded-xs overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fita decorativa estilo Lumina */}
        <Tape variant="yellow" className="-top-3 right-8 w-24 h-5 rotate-2 pointer-events-none z-10" />

        {/* ✦ 1. CABEÇALHO DO MODAL (ESTILO INSTAGRAM + LUMINA) ✦ */}
        <div className="px-5 py-3.5 border-b-2 border-graphite bg-cream-light flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle size={18} className="text-red-editorial" />
            <h3 className="font-serif font-black text-xl text-graphite tracking-tight">
              Comentários
            </h3>
            <span className="bg-graphite text-white font-mono text-[10px] px-2 py-0.5 font-bold uppercase rounded-xs">
              {comentarios.length}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xs border border-graphite bg-white hover:bg-black hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        {/* ✦ 2. PRÉVIA DO POST ORIGINAL (IGUAL INSTAGRAM NO TOPO) ✦ */}
        <div className="px-5 py-3 border-b border-gray-200 bg-[#FAF8F5] flex items-center gap-3.5 flex-shrink-0">
          {post.imagem ? (
            <div className="w-12 h-12 flex-shrink-0 border border-graphite overflow-hidden bg-gray-100 rounded-xs">
              <img 
                src={post.imagem} 
                alt={post.titulo}
                className="w-full h-full object-cover" 
              />
            </div>
          ) : (
            <div className="w-12 h-12 flex-shrink-0 border border-graphite bg-red-100 text-red-editorial flex items-center justify-center font-serif font-bold text-xs">
              LUMINA
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs font-bold text-graphite truncate">
                {post.autor || 'Autora Lumina'}
              </span>
              <span className="text-[10px] font-mono text-red-editorial font-bold">✧</span>
            </div>
            <p className="font-serif text-xs text-gray-700 truncate font-semibold">
              {post.titulo}
            </p>
          </div>
        </div>

        {/* ✦ 3. CORPO COM A LISTA DE COMENTÁRIOS COM ROLAGEM ✦ */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-white">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <Loader2 size={28} className="animate-spin text-red-editorial mb-3" />
              <p className="font-mono text-xs uppercase tracking-widest text-gray-500">
                Carregando comentários... ✧
              </p>
            </div>
          ) : comentarios.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4 text-gray-400">
              <Sparkles size={32} className="text-red-editorial/60 mb-3" />
              <h4 className="font-serif font-bold text-base text-graphite mb-1">
                Nenhum comentário ainda
              </h4>
              <p className="font-sans text-xs text-gray-500 max-w-xs">
                Seja a primeira pessoa a deixar sua impressão sobre esta publicação! ✧
              </p>
            </div>
          ) : (
            comentarios.map((c) => {
              const curtiu = !!comentariosCurtidos[c.id];
              const iniciais = (c.autor || 'U')
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();

              return (
                <div key={c.id} className="flex items-start gap-3 group">
                  {/* Avatar do Autor do Comentário */}
                  {c.autor_foto ? (
                    <img
                      src={c.autor_foto}
                      alt={c.autor}
                      className="w-8 h-8 rounded-full border border-graphite object-cover flex-shrink-0 mt-0.5"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full border border-graphite bg-cream-light text-graphite flex items-center justify-center font-mono font-bold text-[11px] flex-shrink-0 mt-0.5">
                      {iniciais}
                    </div>
                  )}

                  {/* Conteúdo textual do comentário */}
                  <div className="flex-1 min-w-0">
                    <div className="bg-cream-light/60 border border-gray-200 p-3 rounded-xs">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <Link
                          to={c.usuario_id ? `/perfil/${c.usuario_id}` : '#'}
                          onClick={onClose}
                          className="font-mono text-xs font-bold text-graphite hover:text-red-editorial transition-colors truncate"
                        >
                          {c.autor || 'Leitora'}
                        </Link>
                        <span className="font-mono text-[10px] text-gray-400 flex-shrink-0">
                          {formatarTempo(c.criado_em)}
                        </span>
                      </div>
                      <p className="font-sans text-xs sm:text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
                        {c.texto}
                      </p>
                    </div>
                  </div>

                  {/* Curtir comentário individual (estilo Instagram) */}
                  <button
                    type="button"
                    onClick={() => toggleCurtidaComentario(c.id)}
                    className="p-1.5 text-gray-400 hover:text-red-editorial transition-colors flex-shrink-0 mt-1 cursor-pointer"
                    title={curtiu ? 'Descurtir comentário' : 'Curtir comentário'}
                  >
                    <Heart
                      size={13}
                      className={curtiu ? 'fill-red-editorial text-red-editorial scale-110' : ''}
                    />
                  </button>
                </div>
              );
            })
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* ✦ 4. BARRA DE ENTRADA FIXA INFERIOR (IGUAL INSTAGRAM) ✦ */}
        <div className="border-t-2 border-graphite bg-cream-light p-3 sm:p-4 flex-shrink-0 space-y-2.5">
          {erro && (
            <div className="bg-red-100 border border-red-editorial text-red-editorial font-mono text-[11px] p-2 text-center">
              ⚠ {erro}
            </div>
          )}

          {/* Atalhos Rápidos de Emojis */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-base select-none">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleEmojiClick(emoji)}
                className="hover:scale-125 transition-transform p-1 cursor-pointer active:scale-95"
                title={`Inserir ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Campo de Digitação e Botão Publicar */}
          {isLogged ? (
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={novoComentario}
                onChange={(e) => setNovoComentario(e.target.value)}
                placeholder={`Comentar como ${userLogado?.nome || 'você'}...`}
                className="flex-1 bg-white border border-graphite px-3.5 py-2.5 text-xs sm:text-sm font-sans text-graphite placeholder:text-gray-400 focus:outline-none focus:border-red-editorial transition-colors"
                disabled={enviando}
              />

              <button
                type="submit"
                disabled={!novoComentario.trim() || enviando}
                className="bg-red-editorial hover:bg-black disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-mono text-xs font-bold uppercase tracking-wider px-4 py-2.5 border border-graphite transition-all shadow-[2px_2px_0_0_#111111] hover:shadow-none flex items-center gap-1.5 cursor-pointer flex-shrink-0"
              >
                {enviando ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    <span>PUBLICAR</span>
                    <Send size={12} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="bg-white border border-graphite p-3 text-center flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="font-sans text-xs text-gray-600">
                Faça login para interagir e deixar seu comentário.
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/login');
                }}
                className="bg-graphite text-white font-mono text-xs uppercase font-bold tracking-wider px-4 py-1.5 hover:bg-red-editorial transition-colors cursor-pointer"
              >
                Entrar ✧
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentsModal;
