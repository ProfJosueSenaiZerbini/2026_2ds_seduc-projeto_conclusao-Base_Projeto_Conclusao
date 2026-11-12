import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, BookOpen, User, PlusCircle, LogOut } from 'lucide-react';

const Header = () => {
  const [userName, setUserName] = useState('');
  const [isLogged, setIsLogged] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const isLanding = location.pathname === '/';
  const isLogin = location.pathname === '/login';
  const isRegister = location.pathname === '/register';
  const isAuthPage = isLanding || isLogin || isRegister;

  useEffect(() => {
    const token = localStorage.getItem('plural_token');
    const userRaw = localStorage.getItem('plural_user');
    if (token) {
      setIsLogged(true);
      if (userRaw) {
        try {
          const user = JSON.parse(userRaw);
          setUserName(user.nome || user.email || 'Usuária');
          setCurrentUserId(user.id || user.usuario_id || user._id);
        } catch (e) {
          setUserName('Usuária');
        }
      }
    } else {
      setIsLogged(false);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('plural_token');
    localStorage.removeItem('plural_user');
    setIsLogged(false);
    navigate('/login');
  };

  const showSubscriberNav = isLogged && !isAuthPage;

  return (
    <header className="w-full bg-[#F9F6F0] border-b border-gray-300 sticky top-0 z-[100]">

      {/* ✦ BANNERS DE SINALIZAÇÃO DE ROTA ✦ */}
      {!showSubscriberNav ? (
        <div className="w-full bg-[#E8E08C] border-b border-graphite text-center py-1.5 px-2 font-mono text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-graphite select-none flex items-center justify-center gap-2">
          <span>✧</span>
          <span>
            {isLogin && '✦ ACESSO AO SISTEMA — DIGITE SUAS CREDENCIAIS ✦'}
            {isRegister && '✦ CADASTRO DE NOVA INTEGRANTE — JUNTE-SE A NÓS ✦'}
            {!isLogin && !isRegister && '✦ EDIÇÃO DE APRESENTAÇÃO PÚBLICA — DESTAQUES DA REVISTA ✦'}
          </span>
          <span>✧</span>
        </div>
      ) : (
        <div className="w-full bg-graphite border-b border-black text-center py-1.5 px-4 font-mono text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-white flex justify-between items-center select-none">
          <div className="flex items-center gap-2 sm:gap-3">
            <span>● PAINEL DO ASSINANTE | BEM-VINDO(A), {userName.toUpperCase()}</span>
            {currentUserId && (
              <Link 
                to={`/perfil/${currentUserId}`} 
                className="text-red-editorial underline decoration-1 underline-offset-2 hover:text-white transition-colors"
              >
                [MEU PERFIL]
              </Link>
            )}
          </div>
          <button onClick={handleLogout} className="hover:text-red-editorial transition-colors flex items-center gap-1 cursor-pointer">
            SAIR <LogOut size={12} />
          </button>
        </div>
      )}

      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo LUMINA + */}
          <Link to={showSubscriberNav ? "/home" : "/"} className="flex items-center group">
            <span className="font-serif font-black text-2xl sm:text-3xl tracking-tight text-graphite">
              LUMINA
            </span>
            <span className="ml-1 text-red-editorial font-bold text-sm sm:text-base select-none">
              ✦
            </span>
          </Link>

          {/* Ações da Direita */}
          {showSubscriberNav ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Ícone Home */}
              <button
                onClick={() => navigate("/home")}
                className={`w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-sm transition-colors ${
                  location.pathname === '/home'
                    ? 'bg-graphite text-white hover:bg-black'
                    : 'text-graphite hover:bg-cream border border-transparent hover:border-gray-300'
                }`}
                title="Início"
              >
                <Home size={18} />
              </button>

              {/* Ícone Página de Resenhas & Categorias */}
              <button
                onClick={() => navigate("/resenhas")}
                className={`w-9 h-9 sm:w-10 sm:h-10 border flex items-center justify-center rounded-sm transition-colors ${
                  location.pathname === '/resenhas'
                    ? 'bg-graphite text-white'
                    : 'text-graphite hover:bg-cream border-transparent hover:border-gray-300'
                }`}
                title="Página de Resenhas & Categorias"
              >
                <BookOpen size={18} />
              </button>

              {/* Ícone Perfil */}
              <button
                onClick={() => navigate(currentUserId ? `/perfil/${currentUserId}` : '/perfil')}
                className={`w-9 h-9 sm:w-10 sm:h-10 border flex items-center justify-center rounded-sm transition-colors ${
                  location.pathname.startsWith('/perfil')
                    ? 'bg-graphite text-white'
                    : 'text-graphite hover:bg-cream border-transparent hover:border-gray-300'
                }`}
                title="Meu Perfil"
              >
                <User size={18} />
              </button>

              {/* Botão NOVO POST */}
              <button
                onClick={() => navigate('/novoPost')}
                className="bg-red-editorial hover:bg-black text-white font-mono text-[11px] sm:text-xs font-bold uppercase tracking-wider px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-sm flex items-center gap-1.5 shadow-[2px_2px_0_0_#1A1A1A] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
              >
                <PlusCircle size={15} />
                <span>NOVO POST</span>
              </button>
            </div>
          ) : (
            /* Ações públicas na página de Login/Cadastro/Landing */
            <div className="flex items-center gap-3">
              {isLogin ? (
                <Link
                  to="/register"
                  className="border-2 border-graphite bg-white text-graphite text-xs font-mono uppercase font-bold tracking-widest px-4 py-2 hover:bg-gray-100 shadow-[2px_2px_0_0_#1A1A1A] transition-all"
                >
                  Cadastre-se
                </Link>
              ) : isRegister ? (
                <Link
                  to="/login"
                  className="bg-red-editorial hover:bg-black text-white text-xs font-mono uppercase font-bold tracking-widest px-4 py-2 shadow-[2px_2px_0_0_#1A1A1A] transition-all"
                >
                  Entrar ✧
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="bg-red-editorial hover:bg-black text-white text-xs font-mono uppercase font-bold tracking-widest px-4 py-2 shadow-[2px_2px_0_0_#1A1A1A] transition-all"
                  >
                    Entrar ✧
                  </Link>
                  <Link
                    to="/register"
                    className="hidden sm:inline-flex border-2 border-graphite bg-white text-graphite text-xs font-mono uppercase font-bold tracking-widest px-4 py-2 hover:bg-gray-100 shadow-[2px_2px_0_0_#1A1A1A] transition-all"
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

export default Header;
