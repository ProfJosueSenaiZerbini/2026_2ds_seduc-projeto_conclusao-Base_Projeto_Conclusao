import pool from '../config/database.js';

export const exibirChatCandidatura = async (req, res) => {
    const candidaturaId = Number(req.params.candidatura_id);
    const usuario = req.session?.usuario;
    const usuarioId = Number(usuario?.id);
    const perfil = typeof usuario?.tipo_perfil === 'string'
        ? usuario.tipo_perfil.trim().toLowerCase()
        : '';

    if (!Number.isInteger(candidaturaId) || candidaturaId <= 0) {
        return res.status(400).send('Identificador de candidatura inválido.');
    }

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
        return res.redirect('/login');
    }

    if (!['contratante', 'trabalhador'].includes(perfil)) {
        return res.status(403).send('Acesso não autorizado.');
    }

    try {
        const candidaturas = await pool.query(
            `SELECT
                b.id AS bico_id,
                b.titulo,
                b.valor,
                DATE_FORMAT(b.data_servico, '%d/%m/%Y') AS data_servico_formatada,
                b.horario,
                b.contratante_id,
                c.trabalhador_id,
                contratante.nome AS contratante_nome,
                trabalhador.nome AS trabalhador_nome
             FROM candidaturas c
             JOIN bicos b ON b.id = c.bico_id
             JOIN usuarios contratante ON contratante.id = b.contratante_id
             JOIN usuarios trabalhador ON trabalhador.id = c.trabalhador_id
             WHERE c.id = ?
               AND c.status = 'Aceito'
               AND (
                    (? = 'contratante' AND b.contratante_id = ?)
                    OR
                    (? = 'trabalhador' AND c.trabalhador_id = ?)
               )`,
            [candidaturaId, perfil, usuarioId, perfil, usuarioId]
        );

        const candidatura = candidaturas[0];

        if (!candidatura) {
            return res.status(404).send('Conversa não encontrada.');
        }

        const contato = perfil === 'contratante'
            ? {
                id: candidatura.trabalhador_id,
                nome: candidatura.trabalhador_nome
            }
            : {
                id: candidatura.contratante_id,
                nome: candidatura.contratante_nome
            };

        const bico = {
            id: candidatura.bico_id,
            titulo: candidatura.titulo,
            valor: candidatura.valor,
            data_servico_formatada: candidatura.data_servico_formatada,
            horario: candidatura.horario
        };

        const mensagens = await pool.query(
            `SELECT
                m.id,
                m.remetente_id,
                u.nome AS remetente_nome,
                m.texto,
                DATE_FORMAT(m.criado_em, '%d/%m/%Y %H:%i') AS horario
             FROM mensagens_chat m
             JOIN usuarios u ON u.id = m.remetente_id
             WHERE m.candidatura_id = ?
             ORDER BY m.criado_em ASC, m.id ASC`,
            [candidaturaId]
        );

        return res.render('chat', {
            usuario,
            contato,
            bico,
            candidaturaId: req.params.candidatura_id,
            mensagens
        });
    } catch (erro) {
        console.error('Erro ao abrir conversa da candidatura:', erro);
        return res.status(500).send('Erro ao carregar a conversa.');
    }
};

export const listarNovasMensagensChat = async (req, res) => {
    const candidaturaId = Number(req.params.candidatura_id);
    const depoisDoId = Number(req.query.depoisDoId);
    const usuario = req.session?.usuario;
    const usuarioId = Number(usuario?.id);
    const perfil = typeof usuario?.tipo_perfil === 'string'
        ? usuario.tipo_perfil.trim().toLowerCase()
        : '';

    if (!Number.isInteger(candidaturaId) || candidaturaId <= 0) {
        return res.status(400).json({ sucesso: false, erro: 'Identificador de candidatura inválido.' });
    }

    if (!Number.isSafeInteger(depoisDoId) || depoisDoId < 0) {
        return res.status(400).json({ sucesso: false, erro: 'Identificador da última mensagem inválido.' });
    }

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
        return res.status(401).json({ sucesso: false, erro: 'Autenticação necessária.' });
    }

    if (!['contratante', 'trabalhador'].includes(perfil)) {
        return res.status(403).json({ sucesso: false, erro: 'Acesso não autorizado.' });
    }

    try {
        const candidaturas = await pool.query(
            `SELECT c.id
             FROM candidaturas c
             JOIN bicos b ON b.id = c.bico_id
             WHERE c.id = ?
               AND c.status = 'Aceito'
               AND (
                    (? = 'contratante' AND b.contratante_id = ?)
                    OR
                    (? = 'trabalhador' AND c.trabalhador_id = ?)
               )`,
            [candidaturaId, perfil, usuarioId, perfil, usuarioId]
        );

        if (candidaturas.length === 0) {
            return res.status(404).json({ sucesso: false, erro: 'Conversa não encontrada.' });
        }

        const mensagens = await pool.query(
            `SELECT
                m.id,
                m.remetente_id,
                u.nome AS remetente_nome,
                m.texto,
                DATE_FORMAT(m.criado_em, '%Y-%m-%d %H:%i:%s') AS criado_em
             FROM mensagens_chat m
             JOIN usuarios u ON u.id = m.remetente_id
             WHERE m.candidatura_id = ?
               AND m.id > ?
             ORDER BY m.id ASC`,
            [candidaturaId, depoisDoId]
        );

        return res.json({ sucesso: true, mensagens });
    } catch (erro) {
        console.error('Erro ao consultar novas mensagens do chat:', erro);
        return res.status(500).json({ sucesso: false, erro: 'Erro ao consultar novas mensagens.' });
    }
};

export const enviarMensagemChat = async (req, res) => {
    const candidaturaId = Number(req.params.candidatura_id);
    const usuario = req.session?.usuario;
    const usuarioId = Number(usuario?.id);
    const perfil = typeof usuario?.tipo_perfil === 'string'
        ? usuario.tipo_perfil.trim().toLowerCase()
        : '';
    const textoRecebido = req.body?.texto;

    if (!Number.isInteger(candidaturaId) || candidaturaId <= 0) {
        return res.status(400).json({ sucesso: false, erro: 'Identificador de candidatura inválido.' });
    }

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
        return res.status(401).json({ sucesso: false, erro: 'Autenticação necessária.' });
    }

    if (!['contratante', 'trabalhador'].includes(perfil)) {
        return res.status(403).json({ sucesso: false, erro: 'Acesso não autorizado.' });
    }

    if (typeof textoRecebido !== 'string' || !textoRecebido.trim()) {
        return res.status(400).json({ sucesso: false, erro: 'A mensagem não pode estar vazia.' });
    }

    const texto = textoRecebido.trim();
    const limiteCaracteres = 2000;

    if ([...texto].length > limiteCaracteres) {
        return res.status(400).json({
            sucesso: false,
            erro: `A mensagem deve ter no máximo ${limiteCaracteres} caracteres.`
        });
    }

    try {
        const candidaturas = await pool.query(
            `SELECT c.id
             FROM candidaturas c
             JOIN bicos b ON b.id = c.bico_id
             WHERE c.id = ?
               AND c.status = 'Aceito'
               AND (
                    (? = 'contratante' AND b.contratante_id = ?)
                    OR
                    (? = 'trabalhador' AND c.trabalhador_id = ?)
               )`,
            [candidaturaId, perfil, usuarioId, perfil, usuarioId]
        );

        if (candidaturas.length === 0) {
            return res.status(404).json({ sucesso: false, erro: 'Conversa não encontrada.' });
        }

        const resultado = await pool.query(
            `INSERT INTO mensagens_chat (candidatura_id, remetente_id, texto)
             VALUES (?, ?, ?)`,
            [candidaturaId, usuarioId, texto]
        );

        const mensagens = await pool.query(
            `SELECT
                m.id,
                m.candidatura_id,
                m.remetente_id,
                u.nome AS remetente_nome,
                m.texto,
                DATE_FORMAT(m.criado_em, '%Y-%m-%d %H:%i:%s') AS criado_em
             FROM mensagens_chat m
             JOIN usuarios u ON u.id = m.remetente_id
             WHERE m.id = ?`,
            [resultado.insertId]
        );

        if (mensagens.length === 0) {
            console.error('Mensagem inserida, mas não foi possível recuperar o registro criado.');
            return res.status(500).json({ sucesso: false, erro: 'Não foi possível confirmar o envio da mensagem.' });
        }

        return res.status(201).json({
            sucesso: true,
            mensagem: mensagens[0]
        });
    } catch (erro) {
        console.error('Erro ao salvar mensagem do chat:', erro);
        return res.status(500).json({ sucesso: false, erro: 'Erro ao salvar a mensagem.' });
    }
};
