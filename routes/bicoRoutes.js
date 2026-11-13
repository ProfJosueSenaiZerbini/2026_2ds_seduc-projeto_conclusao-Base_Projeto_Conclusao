import express from 'express';
import {
    exibirFormularioPublicar,
    cadastrarBico,
    exibirDetalhesBico,
    exibirBicosAtivosContratante,
    candidatarAoBico,
    atualizarStatusCandidatura,
    exibirHistoricoCandidatura,
    exibirGerenciamentoBico,
    finalizarBico,
    salvarAvaliacaoBico,
    cancelarCandidatura,
} from '../controllers/bicoController.js';
import {
    exibirChatCandidatura,
    listarNovasMensagensChat,
    enviarMensagemChat
} from '../controllers/chatController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Publicação e gerenciamento de bicos pelo Contratante
router.get('/ativos', requireAuth, requireRole('contratante'), exibirBicosAtivosContratante);
router.get('/novo', requireAuth, requireRole('contratante'), exibirFormularioPublicar);
router.post('/novo', requireAuth, requireRole('contratante'), cadastrarBico);

// Candidaturas - Ações do Contratante
router.get('/:id/candidatos', requireAuth, requireRole('contratante'), exibirGerenciamentoBico);
router.post('/candidaturas/status', requireAuth, requireRole('contratante'), atualizarStatusCandidatura);
router.post('/:id/finalizar', requireAuth, requireRole('contratante'), finalizarBico);
router.post('/:id/avaliacao', requireAuth, requireRole('contratante'), salvarAvaliacaoBico);
router.get('/candidaturas/:candidatura_id/chat', requireAuth, exibirChatCandidatura);
router.get('/candidaturas/:candidatura_id/chat/mensagens', requireAuth, listarNovasMensagensChat);
router.post('/candidaturas/:candidatura_id/chat/mensagens', requireAuth, enviarMensagemChat);

// Candidaturas - Ação do Trabalhador
router.post('/candidatar', requireAuth, requireRole('trabalhador'), candidatarAoBico);

// Consulta de histórico (pode ser visualizada por qualquer usuário autenticado)
router.get('/candidaturas/:candidatura_id/historico', requireAuth, exibirHistoricoCandidatura);

// Os detalhes do bico podem ser vistos por qualquer usuário autenticado
router.get('/:id', requireAuth, exibirDetalhesBico);

// Rota de gerenciamento exclusiva para o Contratante
router.get('/:id/gerenciar', requireAuth, requireRole('contratante'), exibirGerenciamentoBico);

// Adicione a rota protegida para perfil 'trabalhador'
router.post('/candidaturas/cancelar', requireAuth, requireRole('trabalhador'), cancelarCandidatura);

export default router;
