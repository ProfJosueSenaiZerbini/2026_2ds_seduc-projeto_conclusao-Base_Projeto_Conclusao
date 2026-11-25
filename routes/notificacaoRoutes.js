import express from 'express';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import { listarNotificacoes, marcarNotificacoesLidas } from '../controllers/notificacaoController.js';

const router = express.Router();

// Notificações do trabalhador (sino do cabeçalho), consultadas pelo public/js/notificacoes.js.
router.get('/', requireAuth, requireRole('trabalhador'), listarNotificacoes);
router.post('/lidas', requireAuth, requireRole('trabalhador'), marcarNotificacoesLidas);

export default router;
