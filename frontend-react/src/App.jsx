import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Componentes de Layout e Proteção
import Navbar from './components/Navbar';
import ProtectedRoute from './components/layout/ProtectedRoute';
import PublicRoute from './components/layout/PublicRoute';

// 1. Entrada Pública (Visitantes)
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// 2. Área Logada (Assinantes)
import Home from './pages/Home';
import Resenhas from './pages/Resenhas';
import ResenhasPage from './pages/ResenhasPage';
import PerfilUsuario from './pages/PerfilUsuario';
import PostPage from './pages/PostPage';
import CreatePostPage from './pages/CreatePostPage';
import CategoryPage from './pages/CategoryPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-cream flex flex-col font-sans">
        <Navbar />
        <main className="flex-grow flex flex-col">
          <Routes>
            
            {/* ✦ FLUXO DE VISITANTE (Sem login) ✦ */}
            <Route element={<PublicRoute />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* ✦ FLUXO DO ASSINANTE (Apenas após fazer login ou cadastro) ✦ */}
            <Route element={<ProtectedRoute />}>
              <Route path="/home" element={<Home />} />
              <Route path="/resenhas" element={<Resenhas />} />
              <Route path="/resenhas-page" element={<ResenhasPage />} />
              <Route path="/perfil/:userId" element={<PerfilUsuario />} />
              <Route path="/perfil" element={<PerfilUsuario />} />
              <Route path="/post/:id" element={<PostPage />} />
              <Route path="/novoPost" element={<CreatePostPage />} />
              
              {/* Categorias */}
              <Route path="/teatro" element={<CategoryPage categoryName="TEATRO" />} />
              <Route path="/musica" element={<CategoryPage categoryName="MÚSICA" />} />
              <Route path="/moda" element={<CategoryPage categoryName="MODA" />} />
              <Route path="/cinema" element={<CategoryPage categoryName="CINEMA" />} />
              <Route path="/literatura" element={<CategoryPage categoryName="LITERATURA" />} />
            </Route>

            {/* Rota para páginas inexistentes */}
            <Route path="*" element={<NotFoundPage />} />

          </Routes>
        </main>

        <footer className="border-t border-gray-300/60 py-6 text-center text-xs font-mono uppercase tracking-widest text-gray-editorial bg-cream">
          © {new Date().getFullYear()} Lumina — Crítica de Arte & Cultura
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
