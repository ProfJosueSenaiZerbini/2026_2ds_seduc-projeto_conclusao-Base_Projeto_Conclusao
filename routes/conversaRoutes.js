import express from 'express';
import { requireAuth } from '../middleware/authMiddleware.js';
import { listarConversas } from '../controllers/conversasController.js';

const router = express.Router();

// Caixa de conversas do usuário logado (contratante ou trabalhador).
router.get('/', requireAuth, listarConversas);

export default router;
