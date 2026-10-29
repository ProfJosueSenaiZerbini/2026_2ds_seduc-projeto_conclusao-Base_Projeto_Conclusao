import express from 'express';
import pool from '../config/database.js';
import { cadastrarUsuario, logarUsuario, homeContratante } from '../controllers/authController.js';

const router = express.Router();

router.get('/cadastrar', (_req, res) => {
    res.render('cadastrar');
});

router.get('/login', (_req, res) => {
    res.render('login');
});

const renderHomeTrabalhador = async (req, res) => {
    if (!req.session?.usuario) {
        return res.redirect('/login');
    }

    try {
        const ordenacoes = {
            recentes: 'id DESC',
            maior_preco: 'CAST(valor AS DECIMAL(10, 2)) DESC, id DESC',
            menor_preco: 'CAST(valor AS DECIMAL(10, 2)) ASC, id DESC'
        };
        const ordem = Object.hasOwn(ordenacoes, req.query.ordem)
            ? req.query.ordem
            : 'recentes';
        const busca = typeof req.query.busca === 'string'
            ? req.query.busca.trim().slice(0, 100)
            : '';

        const vagas = await pool.query(
            `SELECT * FROM bicos
             WHERE status = 'Aberto'
               AND (titulo LIKE ? OR descricao LIKE ? OR bairro LIKE ?)
             ORDER BY ${ordenacoes[ordem]}`,
            [`%${busca}%`, `%${busca}%`, `%${busca}%`]
        );

        return res.render('homeTrabalhador', {
            usuario: req.session.usuario,
            vagas,
            busca,
            ordem
        });
    } catch (erro) {
        console.error('Erro ao buscar bicos no banco:', erro);
        return res.status(500).send('Erro interno ao carregar as vagas.');
    }
};

const renderHistoricoTrabalhador = (req, res) => {
    if (!req.session?.usuario) {
        return res.redirect('/login');
    }

    return res.render('historicoTrabalhador', {
        usuario: req.session.usuario
    });
};

router.get('/hometrabalhador', renderHomeTrabalhador);
router.get('/homeTrabalhador', renderHomeTrabalhador);
router.get('/historico', renderHistoricoTrabalhador);
router.get('/historicoTrabalhador', renderHistoricoTrabalhador);

router.get('/homeContratante', homeContratante);
router.post('/cadastrar', cadastrarUsuario);
router.post('/login', logarUsuario);

export default router;
