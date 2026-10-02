import express from 'express';
import {
    exibirFormularioPublicar,
    cadastrarBico,
    exibirDetalhesBico,
    exibirBicosAtivosContratante
} from '../controllers/bicoController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Publicacao e gerenciamento de bicos pertencem ao contratante.
router.get('/ativos', requireAuth, requireRole('contratante'), exibirBicosAtivosContratante);
router.get('/novo', requireAuth, requireRole('contratante'), exibirFormularioPublicar);
router.post('/novo', requireAuth, requireRole('contratante'), cadastrarBico);
// Os detalhes podem ser vistos por qualquer usuario autenticado.
router.get('/:id', requireAuth, exibirDetalhesBico);

export default router;