import express from 'express';
import {
    exibirFormularioPublicar,
    cadastrarBico,
    exibirDetalhesBico,
    exibirBicosAtivosContratante
} from '../controllers/bicoController.js';

const router = express.Router();

router.get('/ativos', exibirBicosAtivosContratante);
router.get('/novo', exibirFormularioPublicar);
router.post('/novo', cadastrarBico);
router.get('/:id', exibirDetalhesBico);

export default router;