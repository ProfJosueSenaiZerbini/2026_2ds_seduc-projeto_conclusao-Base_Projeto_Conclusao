import express from 'express';
import { consultarCep } from '../controllers/cepController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Consulta de endereço pelo CEP, só para o contratante (quem publica bicos).
router.get('/:cep', requireAuth, requireRole('contratante'), consultarCep);

export default router;
