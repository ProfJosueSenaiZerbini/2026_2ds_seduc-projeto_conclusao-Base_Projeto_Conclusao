import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Mail, Calendar, BookOpen, ShieldCheck, ArrowLeft, Loader2, 
  User, MessageSquare, UserPlus, Check, Share2, MoreHorizontal, 
  Sparkles, PlusCircle, ExternalLink, Award, Heart, MapPin, 
  Edit3, Bookmark, Coffee, Feather, Eye, Camera, Upload, X, Tag
} from 'lucide-react';
import { getUserProfile, updateUserProfile, getPosts } from '../services/api';
import Tape from '../components/ui/Tape';
import Badge from '../components/ui/Badge';

// Função para compactar imagens carregadas pelo usuário diretamente no navegador
const compressImage = (file, maxWidth = 1200, maxHeight = 1200) => {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/')) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => resolve(event.target.result);
    };
    reader.onerror = () => resolve(null);
  });
};

const PerfilUsuario = () => {
  const { userId: paramUserId } = useParams();
  const navigate = useNavigate();

  // Dados do perfil e publicações
  const [usuario, setUsuario] = useState(null);
  const [postsDoUsuario, setPostsDoUsuario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados sociais interativos (estilo LinkedIn)
  const [conectado, setConectado] = useState(false);
  const [seguindo, setSeguindo] = useState(false);
  const [mostrarModalContato, setMostrarModalContato] = useState(false);
  const [mostrarMaisOpcoes, setMostrarMaisOpcoes] = useState(false);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'sobre'

  // Modal e Formulário de Edição Completa do Perfil
  const [mostrarModalEdicao, setMostrarModalEdicao] = useState(false);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [sucessoFeedback, setSucessoFeedback] = useState('');
  const [erroEdicao, setErroEdicao] = useState('');

  const [formEdicao, setFormEdicao] = useState({
    nome: '',
    headline: '',
    bio: '',
    localizacao: '',
    status_tag: '#CRIADORA ATIVA',
    foto: '',
    capa: '',
    afiliacao1: 'Redação Coletiva Lumina',
    afiliacao2: 'Clube de Leitura & Crítica Cultural',
    interesses: 'Cinema dos Anos 2000, Literatura Contemporânea, Estética Y2K, Feminismo & Cultura, Artes Visuais, Scrapbook & DIY'
  });

  // Identifica se é o próprio usuário logado
  const localUserRaw = localStorage.getItem('plural_user');
  const localUser = localUserRaw ? JSON.parse(localUserRaw) : null;
  const currentLoggedId = String(localUser?.id || localUser?.usuario_id || localUser?._id || '1');
  const targetId = paramUserId || currentLoggedId;
  const isProprioPerfil = String(currentLoggedId) === String(targetId);

  useEffect(() => {
    window.scrollTo(0, 0);

    const carregarDadosCompletos = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Tenta carregar dados do usuário na API
        let userData = null;
        try {
          const res = await getUserProfile(targetId);
          userData = res.usuario || res;
        } catch (apiErr) {
          console.warn('API /users/:id não respondeu, usando fallback local...', apiErr);
          if (localUser && String(localUser.id || '1') === String(targetId)) {
            userData = localUser;
          }
        }

        // Tenta recuperar dados customizados do localStorage (se existirem)
        const perfilSalvoRaw = localStorage.getItem(`plural_profile_custom_${targetId}`);
        const perfilSalvo = perfilSalvoRaw ? JSON.parse(perfilSalvoRaw) : null;

        if (!userData) {
          userData = {
            id: targetId,
            nome: isProprioPerfil ? (localUser?.nome || 'Garota Lumina') : 'Ezinne Iheanacho - Owelle',
            email: isProprioPerfil ? (localUser?.email || 'contato@lumina.com') : 'ezinne.owelle@lumina.com',
            criado_em: '2026-03-15T10:00:00.000Z',
            total_posts: 14,
            total_likes: 289
          };
        }

        // Mescla com edições salvas localmente
        const dadosCompletos = {
          ...userData,
          ...(perfilSalvo || {}),
          nome: perfilSalvo?.nome || userData?.nome || 'Garota Lumina',
          headline: perfilSalvo?.headline || userData?.headline || (isProprioPerfil 
            ? 'Colunista & Crítica Cultural | Apaixonada por cinema anos 2000, literatura e artes plásticas' 
            : 'Pesquisadora Cultural & Colunista Independente | Explorando estética Y2K e cultura pop'),
          bio: perfilSalvo?.bio || userData?.bio || 'Integrante da comunidade Lumina. Atua como leitora crítica e articulista independente, dedicada à valorização de obras literárias e cinematográficas feitas por mulheres, além do resgate da cultura analógica, diários visuais e fanzines dos anos 2000.',
          localizacao: perfilSalvo?.localizacao || userData?.localizacao || 'São Paulo, Brasil',
          status_tag: perfilSalvo?.status_tag || userData?.status_tag || '#CRIADORA ATIVA',
          foto: perfilSalvo?.foto || userData?.foto || '',
          capa: perfilSalvo?.capa || userData?.capa || '',
          afiliacao1: perfilSalvo?.afiliacao1 || 'Redação Coletiva Lumina',
          afiliacao2: perfilSalvo?.afiliacao2 || 'Clube de Leitura & Crítica Cultural',
          interesses: perfilSalvo?.interesses || userData?.interesses || 'Cinema dos Anos 2000, Literatura Contemporânea, Estética Y2K, Feminismo & Cultura, Artes Visuais, Scrapbook & DIY'
        };

        setUsuario(dadosCompletos);

        // Inicializa o formulário de edição com os dados atuais
        setFormEdicao({
          nome: dadosCompletos.nome || '',
          headline: dadosCompletos.headline || '',
          bio: dadosCompletos.bio || '',
          localizacao: dadosCompletos.localizacao || '',
          status_tag: dadosCompletos.status_tag || '#CRIADORA ATIVA',
          foto: dadosCompletos.foto || '',
          capa: dadosCompletos.capa || '',
          afiliacao1: dadosCompletos.afiliacao1 || 'Redação Coletiva Lumina',
          afiliacao2: dadosCompletos.afiliacao2 || 'Clube de Leitura & Crítica Cultural',
          interesses: typeof dadosCompletos.interesses === 'string' 
            ? dadosCompletos.interesses 
            : Array.isArray(dadosCompletos.interesses) 
              ? dadosCompletos.interesses.join(', ') 
              : 'Cinema, Literatura, Música'
        });

        // 2. Carrega as publicações para exibir os posts reais do perfil
        try {
          const todosPosts = await getPosts();
          if (Array.isArray(todosPosts)) {
            const doAutor = todosPosts.filter(p => {
              const autorId = p.usuario_id || p.usuarioId || p.autorId;
              const autorNome = p.autor || '';
              return String(autorId) === String(targetId) || 
                     autorNome.toLowerCase().includes((dadosCompletos.nome || '').toLowerCase());
            });
            setPostsDoUsuario(doAutor);
          }
        } catch (e) {
          console.warn('Não foi possível carregar posts do autor:', e);
        }

      } catch (err) {
        setError('Não foi possível carregar os dados deste perfil.');
      } finally {
        setLoading(false);
      }
    };

    carregarDadosCompletos();
  }, [targetId, isProprioPerfil]);

  // Upload e processamento de imagem de foto de perfil
  const handleFotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const comprimida = await compressImage(file, 600, 600);
      if (comprimida) {
        setFormEdicao(prev => ({ ...prev, foto: comprimida }));
      }
    } catch (err) {
      console.error('Erro ao processar foto:', err);
    }
  };

  // Upload e processamento de imagem da capa
  const handleCapaUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const comprimida = await compressImage(file, 1600, 800);
      if (comprimida) {
        setFormEdicao(prev => ({ ...prev, capa: comprimida }));
      }
    } catch (err) {
      console.error('Erro ao processar capa:', err);
    }
  };

  // Salvar todas as alterações do perfil
  const handleSalvarPerfilCompleto = async (e) => {
    e.preventDefault();
    setSalvandoEdicao(true);
    setErroEdicao('');

    try {
      // 1. Tenta atualizar na API backend
      try {
        await updateUserProfile(targetId, {
          nome: formEdicao.nome,
          headline: formEdicao.headline,
          bio: formEdicao.bio,
          localizacao: formEdicao.localizacao,
          status_tag: formEdicao.status_tag,
          foto: formEdicao.foto,
          capa: formEdicao.capa,
          interesses: formEdicao.interesses
        });
      } catch (apiErr) {
        console.warn('API não pôde salvar remotamente, gravando localmente no navegador...', apiErr);
      }

      // 2. Persiste os dados localmente no navegador
      const dadosAtualizados = {
        ...usuario,
        ...formEdicao
      };

      setUsuario(dadosAtualizados);
      localStorage.setItem(`plural_profile_custom_${targetId}`, JSON.stringify(dadosAtualizados));

      // Se for o próprio usuário, atualiza também a sessão principal
      if (isProprioPerfil && localUser) {
        const novoLocalUser = {
          ...localUser,
          nome: formEdicao.nome
        };
        localStorage.setItem('plural_user', JSON.stringify(novoLocalUser));
      }

      setSucessoFeedback('Perfil atualizado com sucesso! ✧');
      setTimeout(() => {
        setSucessoFeedback('');
        setMostrarModalEdicao(false);
      }, 1500);

    } catch (err) {
      console.error(err);
      setErroEdicao('Ocorreu um erro ao salvar as alterações do perfil.');
    } finally {
      setSalvandoEdicao(false);
    }
  };

  const handleCompartilhar = () => {
    if (navigator.share) {
      navigator.share({
        title: `Perfil de ${usuario?.nome} na Lumina`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('✧ Link do perfil copiado para a área de transferência!');
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 bg-[#F4F1EA]">
        <Loader2 size={36} className="text-red-editorial animate-spin mb-4" />
        <p className="font-mono text-xs uppercase tracking-widest text-gray-500">
          Carregando perfil editorial... ✧
        </p>
      </div>
    );
  }

  // Error State
  if (error || !usuario) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-cream-light border-2 border-graphite p-8 sm:p-12 shadow-[8px_8px_0_0_#111] relative">
          <Tape variant="yellow" className="-top-3 left-1/2 -translate-x-1/2 w-28 h-6" />

          <h2 className="font-serif font-black text-2xl sm:text-3xl text-graphite mb-2">
            Perfil Inexistente
          </h2>
          <p className="text-gray-editorial text-sm font-sans mb-8">
            {error || 'Nenhum perfil associado a este endereço foi encontrado na nossa base.'}
          </p>

          <button
            onClick={() => navigate('/home')}
            className="inline-flex items-center gap-2 bg-graphite text-white font-mono text-xs uppercase tracking-widest px-6 py-3 hover:bg-red-editorial transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} /> Voltar para o Feed
          </button>
        </div>
      </div>
    );
  }

  const nomeExibicao = usuario.nome || 'Assinante Editorial';
  const iniciais = nomeExibicao
    .split(' ')
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  const dataEntrada = usuario.criado_em 
    ? new Date(usuario.criado_em).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : 'Março de 2026';

  const totalConexoes = 289 + (conectado ? 1 : 0);
  const totalPosts = postsDoUsuario.length > 0 ? postsDoUsuario.length : (usuario.total_posts || 14);

  // Lista de tags de interesse
  const listaInteresses = typeof usuario.interesses === 'string'
    ? usuario.interesses.split(',').map(t => t.trim()).filter(Boolean)
    : Array.isArray(usuario.interesses)
      ? usuario.interesses
      : ['Cinema', 'Literatura', 'Estética Y2K', 'Moda'];

  return (
    <div className="w-full bg-[#F4F1EA] min-h-screen py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Barra Superior / Voltar */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-300">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-graphite hover:text-red-editorial transition-colors font-bold cursor-pointer"
          >
            <ArrowLeft size={15} /> VOLTAR
          </button>
          
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-gray-500 uppercase tracking-widest">
              ID: #{String(targetId).padStart(4, '0')}
            </span>
            <span className="text-red-editorial">✧</span>
          </div>
        </div>

        {/* ✦ CARTÃO 1: CABEÇALHO DO PERFIL ESTILO LINKEDIN (COM IDENTIDADE LUMINA) ✦ */}
        <div className="bg-white border-2 border-graphite shadow-[6px_6px_0_0_#111111] relative">
          
          {/* Fita adesiva decorativa retrô no canto */}
          <Tape variant="yellow" className="-top-3 right-8 w-24 h-6 rotate-2 pointer-events-none" />

          {/* 1.1 Banner / Capa Superior da Página (com overflow-hidden interno) */}
          <div className="relative h-44 sm:h-56 md:h-64 w-full bg-gradient-to-r from-[#E9E4DC] via-[#FAF6F0] to-[#E2DDD5] border-b-2 border-graphite overflow-hidden flex items-center justify-center">
            
            {/* Imagem de Capa Customizada (se definida) */}
            {usuario.capa ? (
              <img 
                src={usuario.capa} 
                alt="Capa do perfil"
                className="w-full h-full object-cover"
              />
            ) : (
              <>
                {/* Padrão de fundo editorial minimalista */}
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#111111_1px,transparent_1px)] [background-size:16px_16px]" />

                {/* Tipografia Artística Central do Banner (como na imagem de referência) */}
                <div className="text-center px-4 relative z-10 select-none">
                  <h2 className="font-serif italic font-normal text-3xl sm:text-5xl md:text-6xl text-graphite tracking-tight drop-shadow-xs">
                    {nomeExibicao}
                  </h2>
                  <span className="block font-mono text-[9px] sm:text-[11px] uppercase tracking-[0.3em] text-gray-500 mt-2 font-bold">
                    ✧ REVISTA & REDE SOCIAL LUMINA ✧
                  </span>
                </div>
              </>
            )}

            {/* Selo no canto do banner */}
            <div className="absolute top-3 left-3 bg-white/95 border border-graphite px-2.5 py-1 text-[10px] font-mono uppercase font-bold tracking-widest text-graphite shadow-xs hidden sm:block">
              ● EDIÇÃO EDITORIAL
            </div>

            {/* Botão de Trocar Capa / Editar Perfil */}
            {isProprioPerfil && (
              <button 
                onClick={() => setMostrarModalEdicao(true)}
                className="absolute top-3 right-3 bg-white hover:bg-black hover:text-white text-graphite border-2 border-graphite px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer z-10"
              >
                <Camera size={13} className="text-red-editorial" />
                <span className="hidden sm:inline">Editar Capa</span>
              </button>
            )}
          </div>

          {/* 1.2 Área de Conteúdo abaixo da Capa (Com padding inferior generoso) */}
          <div className="px-6 sm:px-8 pt-0 pb-10 sm:pb-12">
            
            {/* Linha do Avatar e Destaques da Direita */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-16 sm:-mt-20 mb-6">
              
              {/* Foto de Perfil com Anel de Status (#CRIADORA ATIVA) */}
              <div className="relative inline-block">
                
                {/* Moldura circular com anel de status */}
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white bg-graphite shadow-[4px_4px_0_0_#111111] overflow-hidden flex items-center justify-center relative group">
                  
                  {/* Foto de Perfil ou Monograma */}
                  {usuario.foto ? (
                    <img 
                      src={usuario.foto} 
                      alt={nomeExibicao}
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#2D2D30] to-[#111111] flex items-center justify-center text-white font-serif font-black text-4xl sm:text-5xl select-none">
                      {iniciais}
                    </div>
                  )}

                  {/* Anel de Status Curvado com texto legível sobre o Avatar */}
                  <div className="absolute inset-x-0 bottom-0 bg-green-700 text-white font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-center py-1 border-t-2 border-white shadow-xs z-10">
                    {usuario.status_tag || '#CRIADORA ATIVA'}
                  </div>

                  {/* Botão de Câmera para trocar foto no hover */}
                  {isProprioPerfil && (
                    <button
                      onClick={() => setMostrarModalEdicao(true)}
                      className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer font-mono text-[10px] font-bold uppercase tracking-wider z-20"
                      title="Editar foto de perfil"
                    >
                      <Camera size={20} className="mb-1" />
                      Alterar Foto
                    </button>
                  )}
                </div>

              </div>

              {/* Destaques / Afiliações do Perfil */}
              <div className="flex flex-col gap-2.5 text-xs font-sans text-graphite">
                <div className="flex items-center gap-2.5 font-bold hover:text-red-editorial transition-colors cursor-pointer">
                  <div className="w-7 h-7 rounded-sm border border-graphite bg-red-50 flex items-center justify-center text-red-editorial flex-shrink-0">
                    <Sparkles size={14} />
                  </div>
                  <span>{usuario.afiliacao1 || 'Redação Coletiva Lumina'}</span>
                </div>

                <div className="flex items-center gap-2.5 font-bold hover:text-red-editorial transition-colors cursor-pointer">
                  <div className="w-7 h-7 rounded-sm border border-graphite bg-[#FAF6F0] flex items-center justify-center text-graphite flex-shrink-0">
                    <Feather size={14} />
                  </div>
                  <span>{usuario.afiliacao2 || 'Clube de Leitura & Crítica Cultural'}</span>
                </div>
              </div>

            </div>

            {/* Informações Principais do Usuário */}
            <div className="space-y-3">
              
              {/* Nome e Badges de Verificação (Sem sobrepor nada) */}
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-serif font-black text-2xl sm:text-3xl text-graphite tracking-tight">
                  {nomeExibicao}
                </h1>
                
                {/* Selo de Conta Verificada limpo e destacado */}
                <span className="inline-flex items-center gap-1 bg-red-50 text-red-editorial border border-red-200 px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-sm shadow-2xs">
                  <Check size={11} className="stroke-[3]" /> VERIFICADA
                </span>

                <span className="text-gray-400 font-mono text-xs">
                  · 1º grau
                </span>

                <Badge variant="outline" className="text-[10px]">
                  ASSINANTE
                </Badge>
              </div>

              {/* Headline / Subtítulo Profissional & Pessoal */}
              <p className="font-sans text-sm sm:text-base text-gray-700 leading-snug max-w-3xl">
                {usuario.headline || 'Colunista & Crítica Cultural | Apaixonada por cinema anos 2000, literatura e artes plásticas'}
              </p>

              {/* Localização e Informações de Contato */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-sans text-gray-500 pt-1">
                <span className="flex items-center gap-1 text-gray-600">
                  <MapPin size={13} className="text-red-editorial" />
                  {usuario.localizacao || 'São Paulo, Brasil'}
                </span>

                <span>·</span>

                <button
                  onClick={() => setMostrarModalContato(true)}
                  className="text-red-editorial font-bold hover:underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                >
                  Informações de contato
                </button>
              </div>

              {/* Linha de Métricas / Conexões */}
              <div className="pt-1">
                <span className="font-mono text-xs font-bold text-graphite hover:text-red-editorial transition-colors cursor-pointer">
                  {totalConexoes} conexões
                </span>
                <span className="text-gray-300 mx-2">·</span>
                <span className="font-mono text-xs text-gray-600">
                  {totalPosts} publicações
                </span>
                <span className="text-gray-300 mx-2">·</span>
                <span className="font-mono text-xs text-gray-600">
                  {usuario.total_likes || 289} curtidas recebidas
                </span>
              </div>

            </div>

            {/* 1.3 Botões de Ação Principais (com espaçamento e dropdown sem corte) */}
            <div className="flex flex-wrap items-center gap-3 pt-6 pb-2 border-t border-gray-200 mt-6 relative z-20">
              
              {/* Botão de Edição Completa para o próprio usuário */}
              {isProprioPerfil ? (
                <button
                  onClick={() => setMostrarModalEdicao(true)}
                  className="bg-red-editorial hover:bg-black text-white font-mono text-xs uppercase font-bold tracking-wider px-5 py-2.5 rounded-sm flex items-center gap-2 border-2 border-graphite shadow-[3px_3px_0_0_#111111] hover:shadow-[1px_1px_0_0_#111111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
                >
                  <Edit3 size={15} />
                  <span>EDITAR PERFIL COMPLETO ✧</span>
                </button>
              ) : (
                /* Botão Enviar Mensagem para visitantes */
                <button
                  onClick={() => alert(`✧ Abrindo canal de mensagens diretas com ${nomeExibicao}!`)}
                  className="bg-red-editorial hover:bg-black text-white font-mono text-xs uppercase font-bold tracking-wider px-5 py-2.5 rounded-sm flex items-center gap-2 border-2 border-graphite shadow-[3px_3px_0_0_#111111] hover:shadow-[1px_1px_0_0_#111111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer"
                >
                  <MessageSquare size={14} />
                  <span>ENVIAR RECADO</span>
                </button>
              )}

              {/* Botão Conectar */}
              {!isProprioPerfil && (
                <button
                  onClick={() => setConectado(!conectado)}
                  className={`font-mono text-xs uppercase font-bold tracking-wider px-5 py-2.5 rounded-sm flex items-center gap-1.5 border-2 border-graphite transition-all cursor-pointer ${
                    conectado
                      ? 'bg-graphite text-white shadow-[2px_2px_0_0_#C8102E]'
                      : 'bg-white text-graphite hover:border-red-editorial hover:text-red-editorial shadow-[3px_3px_0_0_#111111]'
                  }`}
                >
                  {conectado ? (
                    <>
                      <Check size={14} className="text-green-400" />
                      <span>CONECTADA</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} />
                      <span>+ CONECTAR</span>
                    </>
                  )}
                </button>
              )}

              {/* Botão Nova Resenha */}
              {isProprioPerfil && (
                <Link
                  to="/novoPost"
                  className="bg-white hover:bg-gray-50 text-graphite hover:text-red-editorial hover:border-red-editorial border-2 border-graphite font-mono text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-sm shadow-[3px_3px_0_0_#111111] flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <PlusCircle size={14} className="text-red-editorial" />
                  <span>NOVO ARTIGO</span>
                </Link>
              )}

              {/* Botão Compartilhar Perfil */}
              <button
                onClick={handleCompartilhar}
                className="bg-white text-graphite hover:bg-gray-50 hover:text-red-editorial border-2 border-graphite font-mono text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-sm shadow-[3px_3px_0_0_#111111] flex items-center gap-1.5 transition-all cursor-pointer"
                title="Compartilhar Perfil"
              >
                <Share2 size={14} />
                <span className="hidden sm:inline">COMPARTILHAR</span>
              </button>

              {/* Menu 'Mais' com Dropdown NÃO cortado */}
              <div className="relative">
                <button
                  onClick={() => setMostrarMaisOpcoes(!mostrarMaisOpcoes)}
                  className="bg-white text-graphite hover:bg-gray-50 border-2 border-graphite p-2.5 rounded-sm shadow-[3px_3px_0_0_#111111] transition-all cursor-pointer"
                  title="Mais ações"
                >
                  <MoreHorizontal size={15} />
                </button>

                {mostrarMaisOpcoes && (
                  <div className="absolute right-0 sm:left-0 mt-2 w-52 bg-white border-2 border-graphite shadow-[5px_5px_0_0_#111111] z-50 py-2 text-xs font-mono uppercase font-bold">
                    <button
                      onClick={() => {
                        handleCompartilhar();
                        setMostrarMaisOpcoes(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-red-50 hover:text-red-editorial transition-colors cursor-pointer"
                    >
                      Copiar Link do Perfil
                    </button>
                    {isProprioPerfil && (
                      <button
                        onClick={() => {
                          setMostrarModalEdicao(true);
                          setMostrarMaisOpcoes(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-red-50 hover:text-red-editorial transition-colors cursor-pointer"
                      >
                        Editar Perfil Completo
                      </button>
                    )}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>

        {/* ✦ CARTÃO 2: CALLOUT CARD "CONECTE-SE" ✦ */}
        {!isProprioPerfil && (
          <div className="bg-white border-2 border-graphite p-6 sm:p-7 shadow-[4px_4px_0_0_#111111] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-graphite mb-0.5">
                Conecte-se para acompanhar novas leituras e resenhas
              </h3>
              <p className="font-sans text-xs text-gray-500">
                Receba notificações sempre que {nomeExibicao} publicar um novo artigo ou crítica na Lumina.
              </p>
            </div>

            <button
              onClick={() => setConectado(!conectado)}
              className="inline-flex items-center justify-center gap-1.5 border-2 border-graphite bg-white hover:bg-red-editorial hover:text-white text-graphite font-mono text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-sm shadow-[2px_2px_0_0_#111111] transition-all flex-shrink-0 cursor-pointer"
            >
              <UserPlus size={14} />
              <span>{conectado ? 'CONECTADA' : 'CONECTAR'}</span>
            </button>
          </div>
        )}

        {/* ✦ CARTÃO 3: DESTAQUE DE ATUAÇÃO (Totalmente desobstruído e legível) ✦ */}
        <div className="bg-white border-2 border-graphite p-6 sm:p-8 shadow-[5px_5px_0_0_#C8102E] relative">
          <Tape variant="yellow" className="-top-3 left-8 w-20 h-5 -rotate-1 pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              
              {/* Badge destacado e 100% legível */}
              <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                <span className="w-2.5 h-2.5 rounded-full bg-green-600 animate-pulse flex-shrink-0" />
                <span className="font-mono text-xs uppercase font-bold tracking-widest text-graphite bg-green-50 border border-green-300 px-2.5 py-0.5 rounded-sm">
                  ● {usuario.status_tag || '#CRIADORA ATIVA'}
                </span>
                <span className="text-gray-300 hidden sm:inline">|</span>
                <span className="font-mono text-xs text-gray-500 uppercase tracking-wider hidden sm:inline">
                  COLABORAÇÃO ATIVA
                </span>
              </div>

              <h4 className="font-serif font-bold text-lg sm:text-xl text-graphite mb-1.5">
                Colaboradora de Ensaios & Crítica Cultural
              </h4>

              <p className="font-sans text-xs sm:text-sm text-gray-600 leading-relaxed max-w-2xl mb-4">
                {usuario.bio ? usuario.bio.slice(0, 180) + '...' : 'Escreve resenhas analíticas sobre cinema internacional, romances contemporâneos e debates sobre a presença feminina nas artes visuais.'}
              </p>

              <button
                onClick={() => setActiveTab('sobre')}
                className="font-mono text-xs font-bold text-red-editorial hover:underline underline-offset-4 uppercase tracking-wider flex items-center gap-1 cursor-pointer"
              >
                <span>VER TRAJETÓRIA COMPLETA & INTERESSES</span>
                <span>→</span>
              </button>
            </div>

            {/* Selo de Verificação NÃO ABSOLUTO (ao lado, com layout limpo e sem sobrepor texto) */}
            <div className="flex sm:flex-col items-center justify-center p-3.5 border-2 border-graphite bg-[#FAF6F0] shadow-[3px_3px_0_0_#111111] flex-shrink-0 select-none">
              <ShieldCheck size={22} className="text-red-editorial mb-1" />
              <span className="font-mono text-[9px] font-black uppercase text-center leading-tight text-graphite">
                PERFIL<br/>VERIFICADO
              </span>
            </div>
          </div>
        </div>

        {/* ✦ CARTÃO 4: ABAS E PUBLICAÇÕES DO USUÁRIO ✦ */}
        <div className="bg-white border-2 border-graphite shadow-[6px_6px_0_0_#111111] p-6 sm:p-8 pb-12 sm:pb-16">
          
          {/* Navegação por Abas */}
          <div className="flex items-center gap-4 sm:gap-8 border-b-2 border-gray-200 pb-4 mb-8">
            <button
              onClick={() => setActiveTab('posts')}
              className={`font-mono text-xs uppercase font-bold tracking-widest pb-2 relative transition-colors cursor-pointer ${
                activeTab === 'posts'
                  ? 'text-red-editorial border-b-2 border-red-editorial -mb-[18px]'
                  : 'text-gray-400 hover:text-graphite'
              }`}
            >
              Publicações ({totalPosts})
            </button>

            <button
              onClick={() => setActiveTab('sobre')}
              className={`font-mono text-xs uppercase font-bold tracking-widest pb-2 relative transition-colors cursor-pointer ${
                activeTab === 'sobre'
                  ? 'text-red-editorial border-b-2 border-red-editorial -mb-[18px]'
                  : 'text-gray-400 hover:text-graphite'
              }`}
            >
              Sobre & Interesses
            </button>
          </div>

          {/* Conteúdo da Aba 1: Publicações / Posts */}
          {activeTab === 'posts' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-serif font-black text-2xl text-graphite tracking-tight">
                    Artigos & Resenhas de {nomeExibicao}
                  </h3>
                  <p className="font-sans text-xs text-gray-500 mt-1">
                    Textos e contribuições publicadas para a comunidade editorial.
                  </p>
                </div>

                {isProprioPerfil && (
                  <Link
                    to="/novoPost"
                    className="inline-flex items-center gap-1.5 bg-red-editorial hover:bg-black text-white font-mono text-xs uppercase font-bold tracking-wider px-4 py-2 border-2 border-graphite shadow-[2px_2px_0_0_#111111] transition-all"
                  >
                    <PlusCircle size={14} />
                    <span>CRIAR POST</span>
                  </Link>
                )}
              </div>

              {postsDoUsuario.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 p-8 sm:p-12 text-center bg-cream/40">
                  <Feather size={28} className="mx-auto text-red-editorial mb-3" />
                  <h4 className="font-serif font-bold text-lg text-graphite mb-1">
                    Nenhuma publicação cadastrada por aqui ainda
                  </h4>
                  <p className="font-sans text-xs text-gray-500 max-w-md mx-auto mb-6">
                    {isProprioPerfil 
                      ? 'Você ainda não publicou nenhuma resenha. Que tal começar a compartilhar seus saberes agora?' 
                      : `${nomeExibicao} ainda está preparando seus primeiros artigos para a revista.`}
                  </p>

                  {isProprioPerfil && (
                    <Link
                      to="/novoPost"
                      className="inline-flex items-center gap-2 bg-graphite hover:bg-red-editorial text-white font-mono text-xs uppercase font-bold tracking-wider px-6 py-3 transition-colors"
                    >
                      <PlusCircle size={15} /> Escrever Primeiro Artigo
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {postsDoUsuario.map((post) => (
                    <article
                      key={post.id}
                      onClick={() => navigate(`/post/${post.id}`)}
                      className="bg-cream-light border-2 border-graphite p-5 shadow-[4px_4px_0_0_#111111] hover:shadow-[6px_6px_0_0_#C8102E] transition-all duration-200 cursor-pointer flex flex-col justify-between group"
                    >
                      <div>
                        {post.imagem && (
                          <div className="aspect-[16/9] w-full overflow-hidden border border-graphite mb-4 bg-gray-100">
                            <img
                              src={post.imagem}
                              alt={post.titulo}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          </div>
                        )}

                        <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-red-editorial bg-red-50 border border-red-200 px-2 py-0.5 inline-block mb-2">
                          ✧ {post.categoria || 'RESENHA'}
                        </span>

                        <h4 className="font-serif font-bold text-lg text-graphite leading-snug mb-2 group-hover:text-red-editorial transition-colors line-clamp-2">
                          {post.titulo}
                        </h4>

                        <p className="font-sans text-xs text-gray-600 line-clamp-2 leading-relaxed mb-4">
                          {post.resumo || post.conteudo}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-xs font-mono text-gray-500">
                        <span className="flex items-center gap-1 text-red-editorial font-bold">
                          <Heart size={13} className="fill-red-editorial" />
                          <span>{post.likes || post.curtidas || 0}</span>
                        </span>

                        <span className="group-hover:translate-x-1 transition-transform font-bold text-graphite">
                          Ler resenha →
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Conteúdo da Aba 2: Sobre & Interesses */}
          {activeTab === 'sobre' && (
            <div className="space-y-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif font-bold text-xl text-graphite mb-3">
                    Trajetória & Filosofia Editorial
                  </h3>
                  <p className="font-sans text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {usuario.bio || 'Sem biografia informada ainda.'}
                  </p>
                </div>

                {isProprioPerfil && (
                  <button
                    onClick={() => setMostrarModalEdicao(true)}
                    className="flex-shrink-0 text-xs font-mono font-bold text-red-editorial uppercase hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 size={12} /> Editar Bio
                  </button>
                )}
              </div>

              {/* Tópicos de Preferência */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="font-serif font-bold text-base text-graphite mb-3 flex items-center gap-2">
                  <BookOpen size={17} className="text-red-editorial" />
                  Tópicos de Preferência & Escrita
                </h4>

                <div className="flex flex-wrap gap-2">
                  {listaInteresses.map((tag, idx) => (
                    <span 
                      key={idx}
                      className="bg-[#FAF6F0] border border-graphite px-3 py-1 font-mono text-xs uppercase font-bold text-graphite shadow-[2px_2px_0_0_#111111]"
                    >
                      ✧ {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Metadados de Inscrição */}
              <div className="border-t border-gray-200 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-graphite p-4 bg-cream-light">
                  <span className="font-mono text-[10px] uppercase font-bold text-red-editorial block mb-1">
                    E-mail de Contato
                  </span>
                  <p className="font-mono text-xs text-graphite flex items-center gap-2">
                    <Mail size={14} className="text-gray-400" />
                    {usuario.email || 'contato@lumina.com'}
                  </p>
                </div>

                <div className="border border-graphite p-4 bg-cream-light">
                  <span className="font-mono text-[10px] uppercase font-bold text-red-editorial block mb-1">
                    Membro Desde
                  </span>
                  <p className="font-mono text-xs text-graphite flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    {dataEntrada}
                  </p>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* ✦ MODAL 1: EDIÇÃO COMPLETA DO PERFIL (TODO O PERFIL EDITÁVEL) ✦ */}
      {mostrarModalEdicao && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-2 border-graphite p-6 sm:p-8 max-w-2xl w-full shadow-[8px_8px_0_0_#111111] relative my-8 max-h-[90vh] overflow-y-auto">
            <Tape variant="yellow" className="-top-3 right-8 w-24 h-6 rotate-1 pointer-events-none" />

            <div className="flex items-center justify-between pb-3 border-b-2 border-graphite mb-6">
              <div className="flex items-center gap-2">
                <Edit3 size={20} className="text-red-editorial" />
                <h3 className="font-serif font-black text-2xl text-graphite">
                  Editar Perfil Completo
                </h3>
              </div>
              <button
                onClick={() => setMostrarModalEdicao(false)}
                className="font-mono text-xs uppercase font-bold text-gray-500 hover:text-red-editorial cursor-pointer"
              >
                [ FECHAR ]
              </button>
            </div>

            {sucessoFeedback && (
              <div className="bg-green-100 border-2 border-green-700 text-green-900 p-3 mb-4 font-mono text-xs font-bold text-center">
                ✓ {sucessoFeedback}
              </div>
            )}

            {erroEdicao && (
              <div className="bg-red-100 border-2 border-red-700 text-red-900 p-3 mb-4 font-mono text-xs font-bold text-center">
                ⚠ {erroEdicao}
              </div>
            )}

            <form onSubmit={handleSalvarPerfilCompleto} className="space-y-6">
              
              {/* 1. Imagem de Capa e Foto de Perfil */}
              <div className="space-y-4 border-2 border-dashed border-gray-300 p-4 bg-gray-50">
                <span className="font-mono text-xs uppercase font-bold tracking-widest text-graphite block">
                  ✦ Imagens do Perfil (Capa & Foto)
                </span>

                {/* Foto de Perfil */}
                <div>
                  <label className="block font-mono text-xs font-bold text-gray-700 mb-1">
                    Foto de Perfil (Avatar)
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full border-2 border-graphite bg-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {formEdicao.foto ? (
                        <img src={formEdicao.foto} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User size={24} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        placeholder="Cole o link da foto de perfil..."
                        value={formEdicao.foto}
                        onChange={(e) => setFormEdicao({ ...formEdicao, foto: e.target.value })}
                        className="w-full border border-graphite p-2 text-xs font-sans focus:outline-hidden focus:border-red-editorial bg-white"
                      />
                      <label className="inline-flex items-center gap-1.5 bg-white border border-graphite px-3 py-1 text-xs font-mono font-bold uppercase cursor-pointer hover:bg-gray-100 shadow-xs">
                        <Upload size={12} /> Carregar do Computador
                        <input type="file" accept="image/*" onChange={handleFotoUpload} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Imagem de Capa */}
                <div>
                  <label className="block font-mono text-xs font-bold text-gray-700 mb-1">
                    Imagem de Capa (Banner Superior)
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Cole o link da imagem de capa..."
                      value={formEdicao.capa}
                      onChange={(e) => setFormEdicao({ ...formEdicao, capa: e.target.value })}
                      className="w-full border border-graphite p-2 text-xs font-sans focus:outline-hidden focus:border-red-editorial bg-white"
                    />
                    <label className="inline-flex items-center gap-1.5 bg-white border border-graphite px-3 py-1 text-xs font-mono font-bold uppercase cursor-pointer hover:bg-gray-100 shadow-xs">
                      <Upload size={12} /> Carregar Imagem de Capa
                      <input type="file" accept="image/*" onChange={handleCapaUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              {/* 2. Nome de Exibição */}
              <div>
                <label className="block font-mono text-xs font-bold uppercase tracking-widest text-graphite mb-1">
                  Nome Completo / Como deseja ser chamada *
                </label>
                <input
                  type="text"
                  required
                  value={formEdicao.nome}
                  onChange={(e) => setFormEdicao({ ...formEdicao, nome: e.target.value })}
                  className="w-full border-2 border-graphite p-2.5 text-sm font-sans focus:outline-hidden focus:border-red-editorial bg-white"
                  placeholder="Ex: Ezinne Iheanacho - Owelle"
                />
              </div>

              {/* 3. Headline / Subtítulo Profissional */}
              <div>
                <label className="block font-mono text-xs font-bold uppercase tracking-widest text-graphite mb-1">
                  Headline / Apresentação Resumida (Estilo LinkedIn)
                </label>
                <textarea
                  rows={2}
                  value={formEdicao.headline}
                  onChange={(e) => setFormEdicao({ ...formEdicao, headline: e.target.value })}
                  className="w-full border-2 border-graphite p-2.5 text-sm font-sans focus:outline-hidden focus:border-red-editorial bg-white resize-none"
                  placeholder="Ex: Colunista & Crítica Cultural | Apaixonada por cinema anos 2000, literatura e artes plásticas"
                />
              </div>

              {/* 4. Localização e Status do Anel do Avatar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs font-bold uppercase tracking-widest text-graphite mb-1">
                    Localização (Cidade, País)
                  </label>
                  <input
                    type="text"
                    value={formEdicao.localizacao}
                    onChange={(e) => setFormEdicao({ ...formEdicao, localizacao: e.target.value })}
                    className="w-full border-2 border-graphite p-2.5 text-sm font-sans focus:outline-hidden focus:border-red-editorial bg-white"
                    placeholder="Ex: São Paulo, Brasil"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs font-bold uppercase tracking-widest text-graphite mb-1">
                    Tag do Anel do Avatar (Status)
                  </label>
                  <input
                    type="text"
                    value={formEdicao.status_tag}
                    onChange={(e) => setFormEdicao({ ...formEdicao, status_tag: e.target.value })}
                    className="w-full border-2 border-graphite p-2.5 text-sm font-sans focus:outline-hidden focus:border-red-editorial bg-white"
                    placeholder="Ex: #CRIADORA ATIVA, #COLUNISTA"
                  />
                </div>
              </div>

              {/* 5. Afiliações / Grupos em Destaque */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-xs font-bold uppercase tracking-widest text-graphite mb-1">
                    Afiliação 1 (Veículo / Coletivo)
                  </label>
                  <input
                    type="text"
                    value={formEdicao.afiliacao1}
                    onChange={(e) => setFormEdicao({ ...formEdicao, afiliacao1: e.target.value })}
                    className="w-full border-2 border-graphite p-2.5 text-sm font-sans focus:outline-hidden focus:border-red-editorial bg-white"
                    placeholder="Ex: Redação Coletiva Lumina"
                  />
                </div>

                <div>
                  <label className="block font-mono text-xs font-bold uppercase tracking-widest text-graphite mb-1">
                    Afiliação 2 (Clube / Comunidade)
                  </label>
                  <input
                    type="text"
                    value={formEdicao.afiliacao2}
                    onChange={(e) => setFormEdicao({ ...formEdicao, afiliacao2: e.target.value })}
                    className="w-full border-2 border-graphite p-2.5 text-sm font-sans focus:outline-hidden focus:border-red-editorial bg-white"
                    placeholder="Ex: Clube de Leitura & Crítica Cultural"
                  />
                </div>
              </div>

              {/* 6. Biografia / Trajetória Detalhada */}
              <div>
                <label className="block font-mono text-xs font-bold uppercase tracking-widest text-graphite mb-1">
                  Biografia Completa & Filosofia Editorial
                </label>
                <textarea
                  rows={4}
                  value={formEdicao.bio}
                  onChange={(e) => setFormEdicao({ ...formEdicao, bio: e.target.value })}
                  className="w-full border-2 border-graphite p-2.5 text-sm font-sans focus:outline-hidden focus:border-red-editorial bg-white resize-y"
                  placeholder="Escreva sobre sua história, suas leituras preferidas, temas que gosta de debater e seu papel na comunidade..."
                />
              </div>

              {/* 7. Tópicos de Preferência */}
              <div>
                <label className="block font-mono text-xs font-bold uppercase tracking-widest text-graphite mb-1">
                  Tópicos de Preferência (separados por vírgula)
                </label>
                <input
                  type="text"
                  value={formEdicao.interesses}
                  onChange={(e) => setFormEdicao({ ...formEdicao, interesses: e.target.value })}
                  className="w-full border-2 border-graphite p-2.5 text-sm font-sans focus:outline-hidden focus:border-red-editorial bg-white"
                  placeholder="Ex: Cinema Anos 2000, Literatura, Fotografia, Estética Y2K"
                />
              </div>

              {/* Botões de Ação do Modal */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-gray-200">
                <button
                  type="button"
                  onClick={() => setMostrarModalEdicao(false)}
                  className="bg-white hover:bg-gray-100 text-graphite font-mono text-xs uppercase font-bold tracking-wider px-5 py-2.5 border-2 border-graphite cursor-pointer"
                >
                  CANCELAR
                </button>

                <button
                  type="submit"
                  disabled={salvandoEdicao}
                  className="bg-red-editorial hover:bg-black text-white font-mono text-xs uppercase font-bold tracking-wider px-6 py-2.5 border-2 border-graphite shadow-[3px_3px_0_0_#111111] hover:shadow-[1px_1px_0_0_#111111] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {salvandoEdicao ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> SALVANDO...
                    </>
                  ) : (
                    <>
                      <Check size={14} /> SALVAR ALTERAÇÕES ✧
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ✦ MODAL 2: INFORMAÇÕES DE CONTATO ✦ */}
      {mostrarModalContato && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-graphite p-6 sm:p-8 max-w-md w-full shadow-[8px_8px_0_0_#111111] relative">
            <Tape variant="yellow" className="-top-3 right-8 w-20 h-5 rotate-1 pointer-events-none" />

            <div className="flex items-center justify-between pb-3 border-b-2 border-graphite mb-6">
              <h3 className="font-serif font-black text-xl text-graphite">
                Informações de Contato
              </h3>
              <button
                onClick={() => setMostrarModalContato(false)}
                className="font-mono text-xs uppercase font-bold text-gray-500 hover:text-red-editorial cursor-pointer"
              >
                [ FECHAR ]
              </button>
            </div>

            <div className="space-y-4 font-sans text-sm">
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-red-editorial block">
                  Nome Completo
                </span>
                <p className="font-bold text-graphite">{nomeExibicao}</p>
              </div>

              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-red-editorial block">
                  Endereço Eletrônico
                </span>
                <p className="text-gray-700 flex items-center gap-1.5">
                  <Mail size={14} className="text-gray-400" />
                  {usuario.email || 'Não informado'}
                </p>
              </div>

              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-red-editorial block">
                  Localização
                </span>
                <p className="text-gray-700 flex items-center gap-1.5">
                  <MapPin size={14} className="text-gray-400" />
                  {usuario.localizacao || 'São Paulo, Brasil'}
                </p>
              </div>

              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-red-editorial block">
                  Mural Editorial
                </span>
                <p className="text-xs text-gray-500">
                  Envie recados ou participe das resenhas diretamente pelo feed da comunidade.
                </p>
              </div>
            </div>

            <button
              onClick={() => setMostrarModalContato(false)}
              className="mt-6 w-full bg-graphite text-white font-mono text-xs uppercase font-bold tracking-widest py-2.5 hover:bg-red-editorial transition-colors cursor-pointer"
            >
              Concluído
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default PerfilUsuario;
