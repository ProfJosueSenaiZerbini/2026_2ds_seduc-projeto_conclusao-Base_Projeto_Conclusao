import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const token = localStorage.getItem('plural_token');

  // Se não tem token, joga o usuário de volta para o login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Se tem token, renderiza as rotas filhas
  return <Outlet />;
};

export default ProtectedRoute;

