import pool from '../config/database.js';
import { OBSERVACAO_CANCELAMENTO_BICO, OBSERVACAO_RECUSA_AUTOMATICA } from './bicoController.js';
import { LIMITE_NOTIFICACOES, montarNotificacao } from '../services/notificacoes.js';

// Notificações do trabalhador (sino do cabeçalho). Não há tabela de notificações: elas são os registros de
// historico_candidaturas sobre as candidaturas dele feitos por outra pessoa (aceite e recusas). A tabela
// notificacoes_leitura guarda só até qual registro ele já viu.

const OBSERVACOES = {
    recusaAutomatica: OBSERVACAO_RECUSA_AUTOMATICA,
    cancelamentoBico: OBSERVACAO_CANCELAMENTO_BICO
};

// Filtro comum: candidaturas do trabalhador, alteradas por outra pessoa, para Aceito ou Recusado.
const FILTRO_NOTIFICACOES = `c.trabalhador_id = ?
               AND h.alterado_por <> ?
               AND h.status_novo IN ('Aceito', 'Recusado')`;

const usuarioDaSessao = (req) => {
    const id = Number(req.session?.usuario?.id || req.session?.usuario?.id_usuario);
    return Number.isInteger(id) && id > 0 ? id : null;
};

// GET /notificacoes -> { naoLidas, notificacoes: [...] } (as 20 mais recentes).
export const criarListadorNotificacoes = (banco) => async (req, res) => {
    const usuarioId = usuarioDaSessao(req);
    if (!usuarioId) return res.status(401).json({ erro: 'Autenticação necessária.' });

    try {
        const leitura = await banco.query('SELECT ultimo_lido_id FROM notificacoes_leitura WHERE usuario_id = ?', [
            usuarioId
        ]);
        const ultimoLidoId = Number(leitura[0]?.ultimo_lido_id || 0);

        const linhas = await banco.query(
            `SELECT h.id, h.status_anterior, h.status_novo, h.observacao, h.data_alteracao,
                    b.id AS bico_id, b.titulo
             FROM historico_candidaturas h
             JOIN candidaturas c ON c.id = h.candidatura_id
             JOIN bicos b ON b.id = c.bico_id
             WHERE ${FILTRO_NOTIFICACOES}
             ORDER BY h.id DESC
             LIMIT ${LIMITE_NOTIFICACOES}`,
            [usuarioId, usuarioId]
        );

        const contagem = await banco.query(
            `SELECT COUNT(*) AS total
             FROM historico_candidaturas h
             JOIN candidaturas c ON c.id = h.candidatura_id
             WHERE ${FILTRO_NOTIFICACOES}
               AND h.id > ?`,
            [usuarioId, usuarioId, ultimoLidoId]
        );

        const notificacoes = linhas.map((linha) => montarNotificacao(linha, OBSERVACOES, ultimoLidoId)).filter(Boolean);

        res.set('Cache-Control', 'no-store');
        return res.json({ naoLidas: Number(contagem[0]?.total || 0), notificacoes });
    } catch (erro) {
        console.error('Erro ao listar notificações:', erro?.code || 'erro inesperado');
        return res.status(500).json({ erro: 'Erro ao carregar as notificações.' });
    }
};
export const listarNotificacoes = criarListadorNotificacoes(pool);

// POST /notificacoes/lidas { ateId } -> marca como lidas até a notificação mais nova que a tela mostrou.
// O cliente manda o id que viu (e não "todas"), para não marcar uma que chegou depois de abrir o painel.
export const criarMarcadorLidas = (banco) => async (req, res) => {
    const usuarioId = usuarioDaSessao(req);
    if (!usuarioId) return res.status(401).json({ erro: 'Autenticação necessária.' });

    const ateId = req.body?.ateId;
    if (!Number.isSafeInteger(ateId) || ateId <= 0 || ateId > 2147483647) {
        return res.status(400).json({ erro: 'Identificador de notificação inválido.' });
    }

    try {
        // GREATEST: uma aba antiga não desmarca o que outra aba já marcou como lido.
        await banco.query(
            `INSERT INTO notificacoes_leitura (usuario_id, ultimo_lido_id)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE ultimo_lido_id = GREATEST(ultimo_lido_id, VALUES(ultimo_lido_id))`,
            [usuarioId, ateId]
        );
        return res.json({ ok: true });
    } catch (erro) {
        console.error('Erro ao marcar notificações como lidas:', erro?.code || 'erro inesperado');
        return res.status(500).json({ erro: 'Erro ao atualizar as notificações.' });
    }
};
export const marcarNotificacoesLidas = criarMarcadorLidas(pool);
