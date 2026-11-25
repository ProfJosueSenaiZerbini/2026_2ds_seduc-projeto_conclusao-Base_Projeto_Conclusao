import express from 'express';
import pool from '../config/database.js';
import {
    cadastrarUsuario,
    logarUsuario,
    homeContratante,
    exibirHistoricoTrabalhador
} from '../controllers/authController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import { contarBicosParaAvaliar } from '../controllers/avaliacaoRegras.js';

const router = express.Router();

router.get('/cadastrar', (_req, res) => {
    res.render('cadastrar', { erro: null, dados: {} });
});

router.get('/login', (req, res) => {
    // Mostra o aviso "flash" quando houver, por exemplo a sessão encerrada por troca de senha (#162).
    res.render('login', { erro: res.locals.alerta?.mensagem || null });
});

const renderHomeTrabalhador = async (req, res) => {
    if (!req.session?.usuario) {
        return res.redirect('/login');
    }

    try {
        // Vagas abertas, exceto as que o contratante já recusou para este trabalhador
        // e as que o próprio trabalhador cancelou (não pode se candidatar de novo).
        const vagas = await pool.query(
            `SELECT b.*, u.nome AS contratante_nome,
                    (SELECT ROUND(AVG(av.nota), 1) FROM avaliacoes av WHERE av.avaliado_id = u.id) AS contratante_media,
                    (SELECT COUNT(*) FROM avaliacoes av WHERE av.avaliado_id = u.id) AS contratante_total_avaliacoes
             FROM bicos b
             JOIN usuarios u ON u.id = b.contratante_id
             WHERE b.status = 'Aberto'
               AND NOT EXISTS (
                   SELECT 1 FROM candidaturas c
                   WHERE c.bico_id = b.id
                     AND c.trabalhador_id = ?
                     AND c.status IN ('Recusado', 'Cancelado')
               )`,
            [req.session.usuario.id]
        );

        const bicosParaAvaliar = await contarBicosParaAvaliar(pool, 'trabalhador_id', req.session.usuario.id);

        return res.render('trabalhador/homeTrabalhador', {
            usuario: req.session.usuario,
            vagas,
            bicosParaAvaliar
        });
    } catch (erro) {
        console.error('Erro ao buscar bicos no banco:', erro);
        return res.status(500).send('Erro interno ao carregar as vagas.');
    }
};

// O painel e o historico ficam restritos ao perfil trabalhador.
router.get('/hometrabalhador', requireAuth, requireRole('trabalhador'), renderHomeTrabalhador);
router.get('/homeTrabalhador', requireAuth, requireRole('trabalhador'), renderHomeTrabalhador);
router.get('/historico', requireAuth, requireRole('trabalhador'), exibirHistoricoTrabalhador);
router.get('/historicoTrabalhador', requireAuth, requireRole('trabalhador'), exibirHistoricoTrabalhador);

// O painel do contratante so pode ser acessado pelo perfil correspondente.
router.get('/homeContratante', requireAuth, requireRole('contratante'), homeContratante);
router.post('/cadastrar', cadastrarUsuario);
router.post('/login', logarUsuario);
// Encerra a sessao atual antes de devolver o usuario para o login.
router.post('/logout', (req, res) => {
    req.session.destroy((erro) => {
        if (erro) {
            console.error('Erro ao encerrar a sessao:', erro);
            return res.status(500).send('Nao foi possivel sair da conta.');
        }

        return res.redirect('/login');
    });
});

export default router;
