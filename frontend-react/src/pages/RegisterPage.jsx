import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { register } from '../services/api';
import Tape from '../components/ui/Tape';
import Sparkle from '../components/ui/Sparkle';
import Stamp from '../components/ui/Stamp';

const INTERESTS = ['Cinema', 'Literatura', 'Música', 'Teatro', 'Moda', 'Artes Visuais'];

const RegisterPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', interests: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const handleInterestToggle = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest) 
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setError('Preencha os campos obrigatórios.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // JSON Payload enviado: { name, email, password, interests: [...] }
      const response = await register(formData);
      
      // Assumindo que a API retorna o token direto no registro também
      if (response.token) {
        const user = response.user || response.usuario;
        localStorage.setItem('plural_token', response.token);
        localStorage.setItem('plural_user', JSON.stringify(user));
        navigate('/home');
        return;
      }
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.mensagem || 'Erro ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      <Sparkle className="absolute top-20 right-10 text-red-editorial text-2xl z-0" delay={0.2} />
      <Stamp text="NOVO<br/>LEITOR" color="black" size="lg" className="absolute -bottom-10 -right-10 opacity-20 pointer-events-none" />

      <div className="w-full max-w-5xl mx-auto flex items-center justify-between absolute top-0 left-0 p-4 sm:p-8">
        <Link to="/" className="text-xs font-mono uppercase tracking-widest text-graphite hover:text-red-editorial transition-colors inline-flex items-center gap-2 font-bold">
          <ArrowLeft size={16} /> Voltar para a Capa
        </Link>
      </div>

      <div className="w-full max-w-xl relative mt-16 sm:mt-8 z-10">
        <div className="bg-cream-light border-2 border-graphite p-8 sm:p-10 shadow-[8px_8px_0px_0px_rgba(17,17,17,1)] relative">
          <Tape variant="yellow" className="-top-4 left-1/2 -translate-x-1/2 w-32 h-8 rotate-1" />

          <div className="text-center mb-8 pt-2">
            <h2 className="font-serif font-black text-3xl sm:text-4xl text-graphite leading-tight mb-2">
              Junte-se à <span className="italic text-red-editorial">Lumina</span>
            </h2>
            <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500 border-b border-gray-300/50 pb-4 inline-block">
              Assinatura Cultural
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-100 border border-red-editorial text-red-editorial text-xs font-bold uppercase tracking-wider p-3 text-center">
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-graphite">Nome Completo</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-cream border border-graphite px-4 py-3 text-graphite font-sans text-sm focus:outline-none focus:border-red-editorial transition-colors" placeholder="Machado de Assis" disabled={loading} />
            </div>

            <div className="space-y-2">
              <label className="block font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-graphite">E-mail</label>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-cream border border-graphite px-4 py-3 text-graphite font-sans text-sm focus:outline-none focus:border-red-editorial transition-colors" placeholder="autor@plural.com" disabled={loading} />
            </div>

            <div className="space-y-2">
              <label className="block font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-graphite">Senha</label>
              <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-cream border border-graphite px-4 py-3 text-graphite font-sans text-sm focus:outline-none focus:border-red-editorial transition-colors" placeholder="••••••••" disabled={loading} />
            </div>

            {/* Interesses */}
            <div className="pt-2">
              <label className="block font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-graphite mb-3">Seus Interesses Principais</label>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map(interest => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => handleInterestToggle(interest)}
                    className={`text-xs font-bold uppercase tracking-widest px-3 py-2 border transition-colors ${
                      formData.interests.includes(interest) ? 'bg-graphite text-white border-graphite' : 'bg-transparent text-gray-500 border-gray-300 hover:border-graphite hover:text-graphite'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full mt-6 bg-red-editorial text-white font-bold uppercase tracking-widest text-sm py-4 px-6 border border-transparent hover:bg-red-strong hover:shadow-[4px_4px_0px_0px_rgba(17,17,17,1)] transition-all duration-200 disabled:opacity-70 flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={18} className="animate-spin" /> REGISTRANDO...</> : <>CRIAR CONTA <span className="font-normal text-lg leading-none">→</span></>}
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-gray-300/50">
            <p className="font-sans text-xs text-gray-500">
              Já faz parte da Lumina? <Link to="/login" className="font-bold text-graphite hover:text-red-editorial uppercase tracking-wider underline decoration-2 underline-offset-4">Entrar</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

