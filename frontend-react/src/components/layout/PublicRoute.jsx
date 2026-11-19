import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PublicRoute = () => {
  const token = localStorage.getItem('plural_token');

  // Se já tem token (está logado), redireciona para a área logada e impede o acesso à página pública/login
  if (token) {
    return <Navigate to="/home" replace />;
  }

  // Se não tem token, permite o acesso (renderiza as rotas filhas)
  return <Outlet />;
};

export default PublicRoute;

