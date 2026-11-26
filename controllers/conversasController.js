import pool from '../config/database.js';
import { urlDaFoto } from '../services/fotoPerfil.js';

const LIMITE_PREVIA = 70;

// Corta a última mensagem para a lista (em caracteres, sem partir emoji ao meio) e junta espaços e quebras de linha.
export const cortarPrevia = (texto, limite = LIMITE_PREVIA) => {
    const limpo = String(texto ?? '')
        .replace(/\s+/g, ' ')
        .trim();
    const letras = [...limpo];
    return letras.length > limite ? `${letras.slice(0, limite - 1).join('')}…` : limpo;
};

// Lista as conversas do usuário logado: candidaturas 'Aceito' em que ele é o contratante do bico ou o
// trabalhador (mesma regra de permissão do exibirChatCandidatura). Mais recente primeiro.
export const criarListadorConversas = (banco) => async (req, res) => {
    const usuario = req.session?.usuario;
    const usuarioId = Number(usuario?.id);
    const perfil = typeof usuario?.tipo_perfil === 'string' ? usuario.tipo_perfil.trim().toLowerCase() : '';

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
        return res.redirect('/login');
    }

    if (!['contratante', 'trabalhador'].includes(perfil)) {
        return res.status(403).send('Acesso não autorizado.');
    }

    try {
        const linhas = await banco.query(
            `SELECT
                c.id AS candidatura_id,
                b.titulo,
                b.status AS bico_status,
                outro.id AS outro_id,
                outro.nome AS outro_nome,
                foto.atualizado_em AS outro_foto_em,
                m.remetente_id AS ultima_remetente_id,
                m.texto AS ultima_texto,
                DATE_FORMAT(m.criado_em, '%d/%m/%Y %H:%i') AS ultima_horario
             FROM candidaturas c
             JOIN bicos b ON b.id = c.bico_id
             JOIN usuarios outro ON outro.id = IF(? = 'contratante', c.trabalhador_id, b.contratante_id)
             LEFT JOIN fotos_perfil foto ON foto.usuario_id = outro.id
             LEFT JOIN mensagens_chat m
                    ON m.id = (SELECT MAX(m2.id) FROM mensagens_chat m2 WHERE m2.candidatura_id = c.id)
             WHERE c.status = 'Aceito'
               AND (
                    (? = 'contratante' AND b.contratante_id = ?)
                    OR
                    (? = 'trabalhador' AND c.trabalhador_id = ?)
               )
             ORDER BY m.id IS NULL, m.id DESC, c.id DESC`,
            [perfil, perfil, usuarioId, perfil, usuarioId]
        );

        const conversas = linhas.map((l) => ({
            candidaturaId: Number(l.candidatura_id),
            titulo: l.titulo,
            bicoStatus: l.bico_status,
            outroNome: l.outro_nome,
            outroFotoUrl: urlDaFoto(l.outro_id, l.outro_foto_em),
            temMensagem: l.ultima_texto != null,
            ultimaPropria: l.ultima_texto != null && Number(l.ultima_remetente_id) === usuarioId,
            ultimaPrevia: l.ultima_texto != null ? cortarPrevia(l.ultima_texto) : '',
            ultimaHorario: l.ultima_horario || ''
        }));

        return res.render('conversas', { usuario, perfil, conversas });
    } catch (erro) {
        console.error('Erro ao listar conversas:', erro);
        return res.status(500).send('Erro ao carregar as conversas.');
    }
};

export const listarConversas = criarListadorConversas(pool);
