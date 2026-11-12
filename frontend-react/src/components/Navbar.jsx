import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { User, LogOut, BookOpen, Home as HomeIcon, PlusCircle } from 'lucide-react';

const Navbar = () => {
  const [userId, setUserId] = useState('1');
  const [userName, setUserName] = useState('');
  const [isLogged, setIsLogged] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Rotas públicas de autenticação / entrada
  const isLanding = location.pathname === '/';
  const isLogin = location.pathname === '/login';
  const isRegister = location.pathname === '/register';
  const isAuthPage = isLanding || isLogin || isRegister;

  // 1. Busca os dados do usuário autenticado no localStorage
  useEffect(() => {
    const token = localStorage.getItem('plural_token');
    const userRaw = localStorage.getItem('plural_user');

    if (token) {
      setIsLogged(true);
      if (userRaw) {
        try {
          const user = JSON.parse(userRaw);
          setUserId(user.id || user.usuario_id || user._id || '1');
          setUserName(user.nome || user.email || 'Usuária');
        } catch (e) {
          setUserId('1');
          setUserName('Usuária');
        }
      }
    } else {
      setIsLogged(false);
      setUserName('');
      setUserId('1');
    }
  }, [location.pathname]);

  // Função para deslogar
  const handleLogout = () => {
    localStorage.removeItem('plural_token');
    localStorage.removeItem('plural_user');
    setIsLogged(false);
    navigate('/');
  };

  // 2. Destaca visualmente a aba ativa através do NavLink com o vermelho editorial
  const getNavLinkClass = ({ isActive }) =>
    `flex items-center gap-1.5 px-3.5 py-2 font-mono text-xs uppercase tracking-widest font-bold transition-all border ${
      isActive
        ? 'bg-graphite text-white border-graphite shadow-[2px_2px_0_0_#C8102E]'
        : 'text-graphite border-transparent hover:border-graphite hover:text-red-editorial hover:bg-red-50/50'
    }`;

  // Se o usuário está na página de login, cadastro, landing ou não está logado, mostra o cabeçalho público
  const showSubscriberNav = isLogged && !isAuthPage;

  return (
    <header className="w-full bg-cream border-b-2 border-graphite sticky top-0 z-[100]">
      
      {/* ✦ BANNERS SUPERIORES DE STATUS ✦ */}
      {showSubscriberNav ? (
        /* Barra de status da área logada */
        <div className="w-full bg-graphite border-b-2 border-black text-center py-1.5 px-4 font-mono text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-white flex justify-between items-center select-none">
          <div className="flex items-center gap-2">
            <span className="text-red-editorial">●</span>
            <span>REDE DA COMUNIDADE | CONECTADA: <span className="text-[#FDFBF7] font-bold">{userName.toUpperCase()}</span> ✧</span>
          </div>
          <button
            onClick={handleLogout}
            className="hover:text-red-editorial transition-colors flex items-center gap-1.5 font-bold cursor-pointer"
            title="Encerrar sessão"
          >
            SAIR <LogOut size={12} />
          </button>
        </div>
      ) : (
        /* Barra de status das páginas públicas (Landing, Login, Cadastro) */
        <div className="w-full bg-[#E8E08C] border-b border-graphite text-center py-1.5 px-2 font-mono text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-graphite select-none flex items-center justify-center gap-2">
          <span>✧</span>
          <span>
            {isLogin && '✦ ACESSO AO SISTEMA — DIGITE SUAS CREDENCIAIS PARA ENTRAR ✦'}
            {isRegister && '✦ CADASTRO DE NOVA INTEGRANTE — JUNTE-SE À NOSSA COMUNIDADE ✦'}
            {isLanding && 'REDE SOCIAL & REVISTA DIGITAL FEMININA — BEM-VINDA AO SEU ESPAÇO'}
            {!isLogin && !isRegister && !isLanding && 'REDE SOCIAL & REVISTA DIGITAL — BEM-VINDA'}
          </span>
          <span>✧</span>
        </div>
      )}

      {/* ✦ BARRA PRINCIPAL ✦ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo da Revista com destaque em Vermelho */}
          <Link to={showSubscriberNav ? "/home" : "/"} className="flex items-center gap-1.5 group">
            <span className="font-serif font-black text-2xl sm:text-3xl tracking-tight text-graphite group-hover:text-red-editorial transition-colors">
              LUMINA
            </span>
            <span className="text-red-editorial text-sm font-bold animate-pulse">✧</span>
          </Link>

          {/* ✦ MENU DE NAVEGAÇÃO ✦ */}
          {showSubscriberNav ? (
            /* Menu da Área Logada (Feed, Resenhas, Meu Perfil e Criar Post) */
            <nav className="flex items-center gap-2 sm:gap-3">
              
              {/* 1. Botão Home / Feed */}
              <NavLink to="/home" className={getNavLinkClass}>
                <HomeIcon size={14} />
                <span className="hidden xs:inline">Feed</span>
              </NavLink>

              {/* 2. Botão Resenhas */}
              <NavLink to="/resenhas" className={getNavLinkClass}>
                <BookOpen size={14} />
                <span className="hidden xs:inline">Resenhas</span>
              </NavLink>

              {/* 3. Botão Perfil */}
              <NavLink to={`/perfil/${userId}`} className={getNavLinkClass}>
                <User size={14} />
                <span className="hidden xs:inline">Meu Perfil</span>
              </NavLink>

              {/* Ação de Novo Post */}
              <Link
                to="/novoPost"
                className="bg-red-editorial hover:bg-black text-white text-xs font-mono uppercase font-bold tracking-wider px-3.5 py-2 shadow-y2k hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center gap-1.5 border border-graphite"
              >
                <PlusCircle size={14} />
                <span className="hidden sm:inline">Criar Post</span>
              </Link>

            </nav>
          ) : (
            /* Menu Público (Login, Cadastro ou Landing Page) - SEM Perfil e SEM Criar Post */
            <div className="flex items-center gap-3">
              {isLogin ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-xs text-gray-500 font-sans hidden sm:inline">Não tem uma conta?</span>
                  <Link
                    to="/register"
                    className="border-2 border-graphite bg-white text-graphite text-xs font-mono uppercase font-bold tracking-widest px-4 py-2 hover:bg-gray-100 shadow-y2k hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                  >
                    Cadastre-se
                  </Link>
                </div>
              ) : isRegister ? (
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-xs text-gray-500 font-sans hidden sm:inline">Já possui uma conta?</span>
                  <Link
                    to="/login"
                    className="bg-red-editorial hover:bg-black text-white text-xs font-mono uppercase font-bold tracking-widest px-4 py-2 shadow-y2k hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                  >
                    Entrar ✧
                  </Link>
                </div>
              ) : (
                /* Landing Page padrão */
                <div className="flex items-center gap-2 sm:gap-3">
                  <Link
                    to="/login"
                    className="bg-red-editorial hover:bg-black text-white text-xs font-mono uppercase font-bold tracking-widest px-4 sm:px-5 py-2 sm:py-2.5 shadow-y2k hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  >
                    Entrar ✧
                  </Link>
                  <Link
                    to="/register"
                    className="hidden sm:inline-flex border-2 border-graphite bg-white text-graphite text-xs font-mono uppercase font-bold tracking-widest px-4 sm:px-5 py-2 sm:py-2.5 hover:bg-gray-100 shadow-y2k hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  >
                    Cadastre-se
                  </Link>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </header>
  );
};

export default Navbar;
