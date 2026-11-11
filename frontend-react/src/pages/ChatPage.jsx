import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  MessageSquare, Users, Bot, Send, Sparkles, User, Heart, 
  Smile, ShieldCheck, Check, Clock, UserPlus, ArrowLeft, Loader2
} from 'lucide-react';
import Tape from '../components/ui/Tape';
import Badge from '../components/ui/Badge';
import { 
  getPublicMessages, sendPublicMessage, 
  getPrivateMessages, sendPrivateMessage, chatWithAI 
} from '../services/api';

const QUICK_EMOJIS = ['❤️', '✨', '👏', '😍', '✍️', '☕', '🌿', '📖', '🔥'];

// Contatos da comunidade disponíveis para chamar para conversa íntima
const CONTATOS_PADRAO = [
  { id: '1', nome: 'Ezinne Iheanacho', foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop', status: 'Online agora', bio: 'Colunista de Cinema Y2K & Artes' },
  { id: '2', nome: 'Juliana Mendes', foto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop', status: 'Online há 10m', bio: 'Apaixonada por moda retrô & cafés' },
  { id: '3', nome: 'Beatriz Vasconcelos', foto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop', status: 'Online agora', bio: 'Crítica cultural & fotografia 35mm' },
  { id: '4', nome: 'Camila Duarte', foto: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop', status: 'Online há 1h', bio: 'Autora de ensaios sobre autocuidado' },
  { id: '5', nome: 'Mariana Sales', foto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop', status: 'Online agora', bio: 'Clube de Leitura & Poesia contemporânea' }
];

const SUGESTOES_IA = [
  'Como desacelerar após um dia agitado? 🌿',
  'Me recomende um filme dos anos 2000 acolhedor 🎬',
  'Indicação de livro para ler antes de dormir 📖',
  'Ideias de hobbies tranquilos para fazer em casa ☕'
];

const ChatPage = () => {
  const [searchParams] = useSearchParams();
  const queryUserId = searchParams.get('user');
  const queryUserName = searchParams.get('nome');

  // Modo ativo: 'PUBLICO' | 'PRIVADO' | 'IA'
  const [activeTab, setActiveTab] = useState(queryUserId ? 'PRIVADO' : 'PUBLICO');

  // Usuário autenticado
  const userRaw = localStorage.getItem('plural_user');
  const userLogado = userRaw ? JSON.parse(userRaw) : { id: '99', nome: 'Você' };
  const meuId = String(userLogado.id || '99');

  // ✦ ESTADOS DO CHAT PÚBLICO
  const [mensagensPublicas, setMensagensPublicas] = useState([]);
  const [inputPublico, setInputPublico] = useState('');
  const [loadingPublico, setLoadingPublico] = useState(true);

  // ✦ ESTADOS DO CHAT PRIVADO (INDIVIDUAL)
  const [contatoSelecionado, setContatoSelecionado] = useState(
    queryUserId ? { id: queryUserId, nome: queryUserName || 'Amiga Lumina', foto: '' } : CONTATOS_PADRAO[0]
  );
  const [mensagensPrivadas, setMensagensPrivadas] = useState([]);
  const [inputPrivado, setInputPrivado] = useState('');
  const [modalNovoContato, setModalNovoContato] = useState(false);
  const [nomeNovoContato, setNomeNovoContato] = useState('');

  // ✦ ESTADOS DO CHAT COM IA
  const [mensagensIA, setMensagensIA] = useState([
    {
      id: 'ia-0',
      remetente: 'ia',
      texto: `Olá, ${userLogado.nome || 'querida'}! ✧ Eu sou a Lumina AI, sua companheira de conversas diárias. Estou aqui para te ouvir, desabafar sobre seu dia, trocar dicas de livros, filmes ou indicar hobbies de autocuidado. Como você está se sentindo hoje?`,
      criado_em: new Date().toISOString()
    }
  ]);
  const [inputIA, setInputIA] = useState('');
  const [iaPensando, setIaPensando] = useState(false);

  const scrollRef = useRef(null);

  // Foco e rolagem automática
  const autoScroll = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // 1. Carregar mensagens do Chat Público
  useEffect(() => {
    getPublicMessages()
      .then((data) => {
        if (Array.isArray(data)) setMensagensPublicas(data);
      })
      .catch((err) => console.warn('Erro ao carregar chat público:', err))
      .finally(() => setLoadingPublico(false));
  }, []);

  // 2. Carregar mensagens do Chat Privado
  useEffect(() => {
    if (!contatoSelecionado?.id) return;
    
    // Recupera do storage ou API
    const chaveStorage = `plural_chat_privado_${meuId}_${contatoSelecionado.id}`;
    const salvas = localStorage.getItem(chaveStorage);
    if (salvas) {
      try {
        setMensagensPrivadas(JSON.parse(salvas));
      } catch (e) {}
    } else {
      // Mensagem inicial de acolhimento na conversa privada
      const msgInicial = [
        {
          id: 'init-1',
          remetente_id: contatoSelecionado.id,
          autor: contatoSelecionado.nome,
          texto: `Oi, ${userLogado.nome || 'amiga'}! ✧ Fico feliz que me chamou para conversar. O que você achou das últimas resenhas publicadas?`,
          criado_em: new Date(Date.now() - 1000 * 60 * 15).toISOString()
        }
      ];
      setMensagensPrivadas(msgInicial);
      localStorage.setItem(chaveStorage, JSON.stringify(msgInicial));
    }
  }, [contatoSelecionado, meuId]);

  useEffect(() => {
    autoScroll();
  }, [mensagensPublicas, mensagensPrivadas, mensagensIA, activeTab]);

  // Se veio por query param, atualiza o contato
  useEffect(() => {
    if (queryUserId) {
      setActiveTab('PRIVADO');
      setContatoSelecionado({
        id: queryUserId,
        nome: queryUserName || 'Amiga Lumina',
        foto: ''
      });
    }
  }, [queryUserId, queryUserName]);

  // ✦ ENVIAR MENSAGEM NO CHAT PÚBLICO
  const handleEnviarPublico = async (e) => {
    e.preventDefault();
    const texto = inputPublico.trim();
    if (!texto) return;

    const nova = {
      id: Date.now(),
      usuario_id: meuId,
      autor: userLogado.nome || 'Você',
      autor_foto: userLogado.foto || '',
      texto,
      criado_em: new Date().toISOString()
    };

    setMensagensPublicas(prev => [...prev, nova]);
    setInputPublico('');

    try {
      await sendPublicMessage({ texto, usuarioId: meuId, autor: userLogado.nome });
    } catch (err) {
      console.warn('Erro ao persistir chat público:', err);
    }
  };

  // ✦ ENVIAR MENSAGEM NO CHAT PRIVADO
  const handleEnviarPrivado = async (e) => {
    e.preventDefault();
    const texto = inputPrivado.trim();
    if (!texto) return;

    const nova = {
      id: Date.now(),
      remetente_id: meuId,
      autor: userLogado.nome || 'Você',
      texto,
      criado_em: new Date().toISOString()
    };

    const atualizadas = [...mensagensPrivadas, nova];
    setMensagensPrivadas(atualizadas);
    setInputPrivado('');

    const chaveStorage = `plural_chat_privado_${meuId}_${contatoSelecionado.id}`;
    localStorage.setItem(chaveStorage, JSON.stringify(atualizadas));

    try {
      await sendPrivateMessage(contatoSelecionado.id, {
        texto,
        usuarioId: meuId,
        autor: userLogado.nome,
        destinatarioNome: contatoSelecionado.nome
      });
    } catch (err) {
      console.warn('Erro ao enviar mensagem privada:', err);
    }
  };

  // ✦ CONVERSAR COM A IA LUMINA
  const handleEnviarIA = async (textoInput) => {
    const texto = (textoInput || inputIA).trim();
    if (!texto || iaPensando) return;

    const msgUsuario = {
      id: 'usr-' + Date.now(),
      remetente: 'usuario',
      texto,
      criado_em: new Date().toISOString()
    };

    setMensagensIA(prev => [...prev, msgUsuario]);
    setInputIA('');
    setIaPensando(true);

    try {
      let respostaTexto = '';
      try {
        const res = await chatWithAI({ mensagem: texto, nomeUsuario: userLogado.nome });
        if (res?.resposta) respostaTexto = res.resposta;
      } catch (e) {}

      // Fallback inteligente se a API externa não responder
      if (!respostaTexto) {
        const tLower = texto.toLowerCase();
        if (tLower.includes('livro') || tLower.includes('ler')) {
          respostaTexto = `Para uma leitura acolhedora hoje, recomendo 'Tudo Sobre o Amor' da bell hooks ou 'A Elegância do Ouriço'. São livros que aquecem a alma e despertam reflexões profundas. Você costuma preferir romance ou ensaios? 📖✧`;
        } else if (tLower.includes('filme') || tLower.includes('cinema')) {
          respostaTexto = `Se você quiser algo nostálgico e estiloso dos anos 2000, assista a 'Encontros e Desencontros' (Lost in Translation) ou 'Meninas Malvadas'. Se preferir algo poético, 'Aftersun' é uma obra-prima inesquecível! 🎬✨`;
        } else if (tLower.includes('hobby') || tLower.includes('dia') || tLower.includes('ansiosa')) {
          respostaTexto = `Respire fundo, querida. Que tal experimentar um chá de camomila morno e passar 15 minutos colando recortes em um scrapbook ou organizando suas leituras? Na nossa aba 'Hobbies' você encontra ideias maravilhosas para desacelerar! 🌿`;
        } else {
          respostaTexto = `Adorei conversar sobre isso com você! ✧ Viver com sensibilidade e arte transforma os pequenos momentos do dia a dia. Me conte mais sobre como tem sido a sua rotina essa semana!`;
        }
      }

      const msgIA = {
        id: 'ia-' + Date.now(),
        remetente: 'ia',
        texto: respostaTexto,
        criado_em: new Date().toISOString()
      };

      setMensagensIA(prev => [...prev, msgIA]);
    } catch (err) {
      console.error(err);
    } finally {
      setIaPensando(false);
    }
  };

  // Chamar novo usuário para conversa
  const handleIniciarConversaComNome = (e) => {
    e.preventDefault();
    if (!nomeNovoContato.trim()) return;

    const novoContato = {
      id: 'contato-' + Date.now(),
      nome: nomeNovoContato.trim(),
      foto: '',
      status: 'Online agora',
      bio: 'Assinante da Comunidade Lumina'
    };

    setContatoSelecionado(novoContato);
    setModalNovoContato(false);
    setNomeNovoContato('');
    setActiveTab('PRIVADO');
  };

  return (
    <div className="w-full bg-[#F4F1EA] min-h-[calc(100vh-64px)] py-6 sm:py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* ✦ CABEÇALHO DO CHAT & COMUNIDADE ✦ */}
        <div className="bg-white border-2 border-graphite p-6 sm:p-8 shadow-[6px_6px_0_0_#111111] relative">
          <Tape variant="yellow" className="-top-3 right-8 w-28 h-6 rotate-1 pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-red-editorial text-white font-mono text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-widest">
                  COMUNIDADE LUMINA
                </span>
                <span className="font-mono text-xs text-gray-500 font-bold">
                  ✦ CONEXÃO, REC胜DOS & CONVERSAS DIÁRIAS
                </span>
              </div>
              <h1 className="font-serif font-black text-3xl sm:text-4xl text-graphite tracking-tight">
                Espaço de Conversas & <span className="italic text-red-editorial">Trocas Afetivas</span>
              </h1>
            </div>

            {/* SELETOR DE MODOS DE CONVERSA */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('PUBLICO')}
                className={`font-mono text-xs uppercase font-bold tracking-wider px-4 py-2 border-2 border-graphite transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'PUBLICO'
                    ? 'bg-graphite text-white shadow-[2px_2px_0_0_#C8102E]'
                    : 'bg-white text-graphite hover:border-red-editorial hover:text-red-editorial'
                }`}
              >
                <Users size={14} />
                <span>Mural Público</span>
              </button>

              <button
                onClick={() => setActiveTab('PRIVADO')}
                className={`font-mono text-xs uppercase font-bold tracking-wider px-4 py-2 border-2 border-graphite transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'PRIVADO'
                    ? 'bg-graphite text-white shadow-[2px_2px_0_0_#C8102E]'
                    : 'bg-white text-graphite hover:border-red-editorial hover:text-red-editorial'
                }`}
              >
                <MessageSquare size={14} className="text-red-editorial" />
                <span>Chat Individual (Privado)</span>
              </button>

              <button
                onClick={() => setActiveTab('IA')}
                className={`font-mono text-xs uppercase font-bold tracking-wider px-4 py-2 border-2 border-graphite transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'IA'
                    ? 'bg-graphite text-white shadow-[2px_2px_0_0_#C8102E]'
                    : 'bg-white text-graphite hover:border-red-editorial hover:text-red-editorial'
                }`}
              >
                <Bot size={14} className="text-amber-500" />
                <span>Lumina AI (Diária)</span>
              </button>
            </div>
          </div>
        </div>

        {/* ✦ 1. MURAL PÚBLICO DA PLATAFORMA ✦ */}
        {activeTab === 'PUBLICO' && (
          <div className="bg-white border-2 border-graphite shadow-[6px_6px_0_0_#111111] flex flex-col h-[600px] overflow-hidden">
            {/* Cabeçalho da Sala */}
            <div className="p-4 border-b-2 border-graphite bg-cream-light flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-red-editorial" />
                <h3 className="font-serif font-black text-lg text-graphite">
                  Mural Coletivo da Plataforma
                </h3>
                <span className="bg-green-700 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                  ● Aberto a todas
                </span>
              </div>
              <span className="font-mono text-xs text-gray-500">
                {mensagensPublicas.length} recados trocados
              </span>
            </div>

            {/* Lista de Mensagens Públicas */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#FAF8F5]">
              {loadingPublico ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <Loader2 size={24} className="animate-spin text-red-editorial mb-2" />
                  <span className="font-mono text-xs">Carregando mural...</span>
                </div>
              ) : (
                mensagensPublicas.map((m) => {
                  const isMinha = String(m.usuario_id) === String(meuId);
                  const iniciais = (m.autor || 'U').slice(0, 2).toUpperCase();

                  return (
                    <div key={m.id} className={`flex items-start gap-3 ${isMinha ? 'flex-row-reverse' : ''}`}>
                      {m.autor_foto ? (
                        <img src={m.autor_foto} alt={m.autor} className="w-9 h-9 rounded-full border border-graphite object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full border border-graphite bg-cream-light flex items-center justify-center font-mono font-bold text-xs text-graphite flex-shrink-0">
                          {iniciais}
                        </div>
                      )}

                      <div className={`max-w-[75%] ${isMinha ? 'text-right' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-graphite">
                            {isMinha ? 'Você' : m.autor}
                          </span>
                          <span className="font-mono text-[10px] text-gray-400">
                            {new Date(m.criado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className={`p-3.5 border-2 border-graphite text-xs sm:text-sm font-sans leading-relaxed rounded-xs shadow-[2px_2px_0_0_#111111] ${
                          isMinha ? 'bg-red-50 text-graphite' : 'bg-white text-gray-800'
                        }`}>
                          {m.texto}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={scrollRef} />
            </div>

            {/* Barra de Digitação Pública */}
            <form onSubmit={handleEnviarPublico} className="p-4 bg-cream-light border-t-2 border-graphite flex items-center gap-2">
              <input
                type="text"
                value={inputPublico}
                onChange={(e) => setInputPublico(e.target.value)}
                placeholder="Escreva um recado público para toda a comunidade..."
                className="flex-1 bg-white border-2 border-graphite px-4 py-2.5 text-xs sm:text-sm font-sans focus:outline-none focus:border-red-editorial"
              />
              <button
                type="submit"
                disabled={!inputPublico.trim()}
                className="bg-red-editorial hover:bg-black disabled:bg-gray-300 text-white font-mono text-xs font-bold uppercase tracking-wider px-5 py-2.5 border-2 border-graphite shadow-[2px_2px_0_0_#111111] flex items-center gap-1.5 cursor-pointer"
              >
                <span>ENVIAR</span>
                <Send size={13} />
              </button>
            </form>
          </div>
        )}

        {/* ✦ 2. CHAT INDIVIDUAL / PRIVADO ENTRE DUAS USUÁRIAS ✦ */}
        {activeTab === 'PRIVADO' && (
          <div className="bg-white border-2 border-graphite shadow-[6px_6px_0_0_#111111] flex flex-col md:flex-row h-[620px] overflow-hidden">
            
            {/* Coluna da Esquerda: Contatos & Conversas */}
            <div className="w-full md:w-80 border-b-2 md:border-b-0 md:border-r-2 border-graphite bg-cream-light flex flex-col">
              <div className="p-4 border-b border-gray-300 flex items-center justify-between">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-graphite">
                  Conversas Íntimas
                </span>
                <button
                  onClick={() => setModalNovoContato(true)}
                  className="bg-white hover:bg-red-editorial hover:text-white border border-graphite px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <UserPlus size={12} />
                  <span>+ Chamar</span>
                </button>
              </div>

              {/* Lista de Contatos */}
              <div className="flex-1 overflow-y-auto divide-y divide-gray-200">
                {CONTATOS_PADRAO.map((c) => {
                  const isAtivo = String(contatoSelecionado?.id) === String(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => setContatoSelecionado(c)}
                      className={`w-full text-left p-3.5 flex items-center gap-3 transition-colors cursor-pointer ${
                        isAtivo ? 'bg-white border-l-4 border-l-red-editorial shadow-xs' : 'hover:bg-white/60'
                      }`}
                    >
                      <img src={c.foto} alt={c.nome} className="w-10 h-10 rounded-full border border-graphite object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-serif font-bold text-sm text-graphite truncate">{c.nome}</h4>
                          <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                        </div>
                        <p className="font-sans text-[11px] text-gray-500 truncate">{c.bio}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Coluna da Direita: Janela da Conversa Privada */}
            <div className="flex-1 flex flex-col bg-[#FAF8F5]">
              {/* Topo do Contato Aberto */}
              <div className="p-3.5 sm:p-4 border-b-2 border-graphite bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-graphite overflow-hidden bg-gray-200 flex items-center justify-center font-mono font-bold text-xs text-graphite">
                    {contatoSelecionado?.nome?.slice(0, 2).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-graphite leading-tight">
                      {contatoSelecionado?.nome}
                    </h3>
                    <span className="font-mono text-[10px] text-green-700 font-bold uppercase tracking-wider flex items-center gap-1">
                      ● Conversa Privada & Criptografada
                    </span>
                  </div>
                </div>

                <Link
                  to={`/perfil/${contatoSelecionado?.id}`}
                  className="font-mono text-xs text-red-editorial hover:underline font-bold uppercase tracking-wider"
                >
                  Ver Perfil →
                </Link>
              </div>

              {/* Balões da Conversa Privada */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {mensagensPrivadas.map((m) => {
                  const isMinha = String(m.remetente_id) === String(meuId);

                  return (
                    <div key={m.id} className={`flex ${isMinha ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] p-3.5 border-2 border-graphite rounded-xs shadow-[2px_2px_0_0_#111111] text-xs sm:text-sm font-sans leading-relaxed ${
                        isMinha
                          ? 'bg-graphite text-white'
                          : 'bg-white text-graphite'
                      }`}>
                        <p className="whitespace-pre-wrap">{m.texto}</p>
                        <span className={`block font-mono text-[9px] mt-1 ${isMinha ? 'text-gray-300 text-right' : 'text-gray-400'}`}>
                          {new Date(m.criado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>

              {/* Barra de Digitação Privada */}
              <form onSubmit={handleEnviarPrivado} className="p-4 bg-white border-t-2 border-graphite flex items-center gap-2">
                <input
                  type="text"
                  value={inputPrivado}
                  onChange={(e) => setInputPrivado(e.target.value)}
                  placeholder={`Mensagem privada para ${contatoSelecionado?.nome}...`}
                  className="flex-1 bg-[#FAF8F5] border-2 border-graphite px-4 py-2.5 text-xs sm:text-sm font-sans focus:outline-none focus:border-red-editorial"
                />
                <button
                  type="submit"
                  disabled={!inputPrivado.trim()}
                  className="bg-red-editorial hover:bg-black disabled:bg-gray-300 text-white font-mono text-xs font-bold uppercase tracking-wider px-5 py-2.5 border-2 border-graphite shadow-[2px_2px_0_0_#111111] flex items-center gap-1.5 cursor-pointer"
                >
                  <span>ENVIAR</span>
                  <Send size={13} />
                </button>
              </form>
            </div>

          </div>
        )}

        {/* ✦ 3. CHAT COM IA LUMINA (CONVERSAS DIÁRIAS) ✦ */}
        {activeTab === 'IA' && (
          <div className="bg-white border-2 border-graphite shadow-[6px_6px_0_0_#111111] flex flex-col h-[620px] overflow-hidden">
            {/* Cabeçalho da IA */}
            <div className="p-4 border-b-2 border-graphite bg-cream-light flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full border border-graphite bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="font-serif font-black text-lg text-graphite flex items-center gap-1.5">
                    Lumina AI <Sparkles size={14} className="text-red-editorial" />
                  </h3>
                  <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">
                    Sua Amiga & Assistente para Conversas Diárias
                  </span>
                </div>
              </div>

              <span className="bg-amber-100 border border-amber-300 text-amber-900 font-mono text-[9px] font-bold px-2 py-0.5 rounded-xs uppercase">
                ✦ DIÁLOGOS DE BEM-ESTAR
              </span>
            </div>

            {/* Balões da Conversa com a IA */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#FAF8F5]">
              {mensagensIA.map((m) => {
                const isIA = m.remetente === 'ia';

                return (
                  <div key={m.id} className={`flex items-start gap-3 ${isIA ? '' : 'flex-row-reverse'}`}>
                    <div className={`w-8 h-8 rounded-full border border-graphite flex items-center justify-center flex-shrink-0 text-xs font-mono font-bold ${
                      isIA ? 'bg-amber-100 text-amber-900' : 'bg-graphite text-white'
                    }`}>
                      {isIA ? '✦' : 'EU'}
                    </div>

                    <div className={`max-w-[78%] p-4 border-2 border-graphite rounded-xs shadow-[2px_2px_0_0_#111111] text-xs sm:text-sm font-sans leading-relaxed ${
                      isIA
                        ? 'bg-white text-gray-800 border-l-4 border-l-amber-500'
                        : 'bg-red-editorial text-white'
                    }`}>
                      <p className="whitespace-pre-wrap">{m.texto}</p>
                      <span className={`block font-mono text-[9px] mt-1.5 ${isIA ? 'text-gray-400' : 'text-red-100 text-right'}`}>
                        {new Date(m.criado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {iaPensando && (
                <div className="flex items-center gap-2 text-xs font-mono text-gray-500 py-2">
                  <Loader2 size={16} className="animate-spin text-red-editorial" />
                  <span>Lumina AI está pensando em uma resposta carinhosa... ✧</span>
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            {/* Sugestões Rápidas de Tópicos Diários */}
            <div className="px-4 py-2 bg-cream-light border-t border-gray-200 flex items-center gap-2 overflow-x-auto select-none">
              <span className="font-mono text-[10px] font-bold uppercase text-gray-500 flex-shrink-0">
                Sugestões:
              </span>
              {SUGESTOES_IA.map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleEnviarIA(sug)}
                  className="bg-white hover:bg-red-editorial hover:text-white border border-graphite text-[11px] font-sans px-3 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer shadow-2xs"
                >
                  {sug}
                </button>
              ))}
            </div>

            {/* Barra de Digitação com a IA */}
            <form onSubmit={(e) => { e.preventDefault(); handleEnviarIA(); }} className="p-4 bg-white border-t-2 border-graphite flex items-center gap-2">
              <input
                type="text"
                value={inputIA}
                onChange={(e) => setInputIA(e.target.value)}
                placeholder="Desabafe, peça indicações de livros ou converse sobre seu dia..."
                className="flex-1 bg-[#FAF8F5] border-2 border-graphite px-4 py-2.5 text-xs sm:text-sm font-sans focus:outline-none focus:border-red-editorial"
                disabled={iaPensando}
              />
              <button
                type="submit"
                disabled={!inputIA.trim() || iaPensando}
                className="bg-red-editorial hover:bg-black disabled:bg-gray-300 text-white font-mono text-xs font-bold uppercase tracking-wider px-5 py-2.5 border-2 border-graphite shadow-[2px_2px_0_0_#111111] flex items-center gap-1.5 cursor-pointer"
              >
                <span>CONVERSAR</span>
                <Sparkles size={13} />
              </button>
            </form>
          </div>
        )}

      </div>

      {/* ✦ MODAL: CHAMAR USUÁRIA PARA CONVERSA ÍNTIMA ✦ */}
      {modalNovoContato && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-graphite p-6 sm:p-8 max-w-md w-full shadow-[6px_6px_0_0_#111111] relative">
            <Tape variant="yellow" className="-top-3 right-8 w-20 h-5 rotate-1 pointer-events-none" />

            <h3 className="font-serif font-black text-xl text-graphite mb-1">
              Chamar para Conversa Íntima
            </h3>
            <p className="font-sans text-xs text-gray-500 mb-4">
              Inicie um chat individual com qualquer usuária da comunidade Lumina.
            </p>

            <form onSubmit={handleIniciarConversaComNome} className="space-y-4">
              <div>
                <label className="block font-mono text-xs font-bold uppercase tracking-wider text-graphite mb-1">
                  Nome da Usuária / Amiga
                </label>
                <input
                  type="text"
                  value={nomeNovoContato}
                  onChange={(e) => setNomeNovoContato(e.target.value)}
                  placeholder="Ex: Beatriz Vasconcelos, Mariana..."
                  className="w-full bg-[#FAF8F5] border-2 border-graphite p-2.5 text-sm font-sans focus:outline-none focus:border-red-editorial"
                  autoFocus
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalNovoContato(false)}
                  className="font-mono text-xs text-gray-500 uppercase font-bold px-3 py-2 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-red-editorial hover:bg-black text-white font-mono text-xs uppercase font-bold tracking-wider px-5 py-2.5 border-2 border-graphite shadow-[2px_2px_0_0_#111111] cursor-pointer"
                >
                  Iniciar Conversa ✧
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ChatPage;
