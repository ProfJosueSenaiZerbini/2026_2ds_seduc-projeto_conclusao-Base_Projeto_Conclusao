import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { login } from '../services/api';
import Tape from '../components/ui/Tape';
import Sparkle from '../components/ui/Sparkle';
import Stamp from '../components/ui/Stamp';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !senha) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Importante: o backend espera { email, senha }
      const response = await login({ email, senha });
      
      // Salva no localStorage
      if (response.token) {
        localStorage.setItem('plural_token', response.token);
        localStorage.setItem('plural_user', JSON.stringify(response.usuario));
        
        // Redireciona para a Home da área logada
        navigate('/home');
      }
    } catch (err) {
      setError(
        err.response?.data?.mensagem || 
        'Erro ao tentar acessar. Verifique suas credenciais.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      
      {/* Background Decorativo */}
      <Sparkle className="absolute top-20 left-10 text-red-editorial text-2xl z-0" delay={0} />
      <Sparkle className="absolute bottom-32 right-16 text-gray-400 text-xl z-0" delay={1} />
      <Stamp text="ACESSO<br/>VIP" color="red" size="lg" className="absolute -bottom-10 -left-10 opacity-30 pointer-events-none" />

      {/* Header Simplificado */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between absolute top-0 left-0 p-4 sm:p-8">
        <Link 
          to="/" 
          className="text-xs font-mono uppercase tracking-widest text-graphite hover:text-red-editorial transition-colors inline-flex items-center gap-2 font-bold"
        >
          <ArrowLeft size={16} /> Voltar para a Capa
        </Link>
        <div className="relative">
          <h1 className="font-serif font-black text-2xl tracking-tight text-graphite">
            PLURAL
          </h1>
          <span className="absolute -top-1 -right-3 text-red-editorial text-xs sparkle">✦</span>
        </div>
      </div>

      {/* Card Form */}
      <div className="w-full max-w-md relative mt-16 sm:mt-0 z-10">
        
        {/* Container que simula papel/recorte */}
        <div className="bg-cream-light border-2 border-graphite p-8 sm:p-10 shadow-[8px_8px_0px_0px_rgba(17,17,17,1)] relative">
          
          <Tape variant="yellow" className="-top-4 left-1/2 -translate-x-1/2 w-24 h-8 rotate-2" />

          {/* Título Editorial */}
          <div className="text-center mb-8 pt-2">
            <h2 className="font-serif font-black text-3xl sm:text-4xl text-graphite leading-tight mb-2">
              Acesse sua <br/>
              <span className="italic text-red-editorial">Assinatura</span>
            </h2>
            <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500 border-b border-gray-300/50 pb-4 inline-block">
              Área Exclusiva
            </p>
          </div>

          {/* Erro */}
          {error && (
            <div className="mb-6 bg-red-100 border border-red-editorial text-red-editorial text-xs font-bold uppercase tracking-wider p-3 text-center">
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Input Email */}
            <div className="space-y-2">
              <label className="block font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-graphite">
                E-mail ou Usuário
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-cream border border-graphite px-4 py-3 text-graphite font-sans text-sm focus:outline-none focus:ring-1 focus:ring-red-editorial focus:border-red-editorial transition-colors"
                placeholder="nome@exemplo.com"
                disabled={loading}
              />
            </div>

            {/* Input Senha */}
            <div className="space-y-2 relative">
              <div className="flex items-center justify-between">
                <label className="block font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-graphite">
                  Senha
                </label>
                <button type="button" className="text-[10px] font-sans font-medium text-gray-500 hover:text-red-editorial transition-colors">
                  ESQUECEU A SENHA?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full bg-cream border border-graphite px-4 py-3 text-graphite font-sans text-sm focus:outline-none focus:ring-1 focus:ring-red-editorial focus:border-red-editorial transition-colors pr-12"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-graphite transition-colors"
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 rounded-none border-graphite text-red-editorial focus:ring-red-editorial bg-cream"
              />
              <label htmlFor="remember" className="ml-2 font-mono text-[10px] uppercase tracking-wider text-gray-600 cursor-pointer">
                Lembrar de mim
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-editorial text-white font-bold uppercase tracking-widest text-sm py-4 px-6 border border-transparent hover:bg-red-strong hover:shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> ACESSANDO...</>
              ) : (
                <>ENTRAR <span className="font-normal text-lg leading-none">→</span></>
              )}
            </button>
            
          </form>

          {/* Footer form */}
          <div className="mt-8 text-center pt-6 border-t border-gray-300/50">
            <p className="font-sans text-xs text-gray-500">
              Ainda não tem conta?{' '}
              <Link to="/register" className="font-bold text-graphite hover:text-red-editorial uppercase tracking-wider transition-colors underline decoration-2 underline-offset-4">
                Cadastre-se
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;

