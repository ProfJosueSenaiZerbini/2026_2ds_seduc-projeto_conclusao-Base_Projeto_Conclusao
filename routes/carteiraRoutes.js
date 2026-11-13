
import express from 'express';

import {
  exibirCarteiraContratante,
  exibirCarteiraTrabalhador,
  adicionarSaldoSimulado
} from '../controllers/carteiraController.js';

import {
  requireAuth,
  requireRole
} from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', (req, res) => {
  const usuario = req.session?.usuario;

  if (!usuario) {
    return res.redirect('/login');
  }

  const perfil = usuario.tipo_perfil
    ? usuario.tipo_perfil.trim().toLowerCase()
    : '';

  if (perfil === 'trabalhador') {
    return res.redirect('/carteira/trabalhador');
  }

  if (perfil === 'contratante') {
    return res.redirect('/carteira/contratante');
  }

  return res.redirect('/login');
});

router.get(
  '/contratante',
  requireAuth,
  requireRole('contratante'),
  exibirCarteiraContratante
);

router.post(
  '/contratante/adicionar-saldo',
  requireAuth,
  requireRole('contratante'),
  adicionarSaldoSimulado
);

router.get(
  '/trabalhador',
  requireAuth,
  requireRole('trabalhador'),
  exibirCarteiraTrabalhador
);

export default router;
