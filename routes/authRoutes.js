import express from 'express';
import pool from '../config/database.js';
import { cadastrarUsuario, logarUsuario, homeContratante, exibirHistoricoTrabalhador } from '../controllers/authController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/cadastrar', (_req, res) => {
    res.render('cadastrar', { erro: null, dados: {} });
});

router.get('/login', (req, res) => {
    res.render('login', { erro: null });
});

const renderHomeTrabalhador = async (req, res) => {
    if (!req.session?.usuario) {
        return res.redirect('/login');
    }

    try {
        // Vagas abertas, exceto as que o contratante já recusou para este trabalhador
        // e as que o próprio trabalhador cancelou (não pode se candidatar de novo).
        const vagas = await pool.query(
            `SELECT * FROM bicos b
             WHERE b.status = 'Aberto'
               AND NOT EXISTS (
                   SELECT 1 FROM candidaturas c
                   WHERE c.bico_id = b.id
                     AND c.trabalhador_id = ?
                     AND c.status IN ('Recusado', 'Cancelado')
               )`,
            [req.session.usuario.id]
        );

        return res.render('trabalhador/homeTrabalhador', {
            usuario: req.session.usuario,
            vagas
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