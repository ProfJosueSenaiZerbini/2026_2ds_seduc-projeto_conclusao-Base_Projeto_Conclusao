import express from 'express';
import { 
  exibirCarteiraContratante, 
  exibirCarteiraTrabalhador 
} from '../controllers/carteiraController.js';

const router = express.Router();

// Rota padrão /carteira
router.get('/', (req, res) => {
  const usuario = req.session.usuario;

  // Se o usuário não estiver logado na sessão, envia para a página de login
  if (!usuario) {
    return res.redirect('/login');
  }

  // Normaliza a string do perfil removendo espaços e transformando em minúsculas
  const perfil = usuario.tipo_perfil ? usuario.tipo_perfil.trim().toLowerCase() : '';

  // Redireciona com base no tipo exato do perfil do usuário
  if (perfil === 'trabalhador') {
    return res.redirect('/carteira/trabalhador');
  } else if (perfil === 'contratante') {
    return res.redirect('/carteira/contratante');
  }

  // Caso ocorra algum valor inesperado no perfil, envia para a tela de login
  res.redirect('/login');
});

router.get('/contratante', exibirCarteiraContratante);
router.get('/trabalhador', exibirCarteiraTrabalhador);

export default router;