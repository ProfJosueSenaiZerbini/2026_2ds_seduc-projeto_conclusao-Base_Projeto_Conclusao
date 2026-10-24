import db from '../config/database.js';
import { validarTituloBico, validarDescricaoBico, validarBairroBico, validarDataServico, validarHorarioServico } from '../validations/bicoValidation.js';

export const exibirFormularioPublicar = (req, res) => {
    if (!req.session?.usuario) {
        return res.redirect('/login');
    }

    return res.render('publicarBico', {
        usuario: req.session.usuario,
        erro: null
    });
};

export const cadastrarBico = async (req, res) => {
    const { titulo, descricao, valor, bairro, data_servico, horario } = req.body;
    const contratante_id = req.session?.usuario?.id;

    if (!contratante_id) {
        return res.redirect('/login');
    }

    if (!validarTituloBico(titulo)) {
        return res.status(400).render('publicarBico', {
            usuario: req.session.usuario,
            erro: 'O título deve ter entre 3 e 100 caracteres.'
        });
    }

    if (!validarDescricaoBico(descricao)) {
        return res.status(400).render('publicarBico', {
            usuario: req.session.usuario,
            erro: 'A descrição deve ter entre 10 e 500 caracteres.'
        });
    }

    if (!validarBairroBico(bairro)) {
        return res.status(400).render('publicarBico', {
            usuario: req.session.usuario,
            erro: 'O bairro deve ter entre 2 e 100 caracteres.'
        });
    }

    if (!validarDataServico(data_servico)) {
        return res.status(400).render('publicarBico', {
            usuario: req.session.usuario,
            erro: 'Informe a data do serviço.'
        });
    }

    if (!validarHorarioServico(horario)) {
        return res.status(400).render('publicarBico', {
            usuario: req.session.usuario,
            erro: 'Informe o horário do serviço.'

        });
    }

    const valorNumerico = Number(valor);

    if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
        return res.status(400).render('publicarBico', {
            usuario: req.session.usuario,
            erro: ' O valor do bico deve ser maior que zero.'
        });
    }

    try {
        const query = `
            INSERT INTO bicos (contratante_id, titulo, descricao, valor, bairro, data_servico, horario, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Aberto')
        `;

        await db.query(query, [
            contratante_id,
            titulo,
            descricao,
            valorNumerico,
            bairro,
            data_servico,
            horario
        ]);

        console.log(`✅ Novo bico publicado com sucesso por contratante ID ${contratante_id}!`);
        return res.redirect('/homeContratante');
    } catch (erro) {
        console.error('❌ Erro ao cadastrar bico no banco:', erro);
        return res.status(500).send('Erro ao publicar o bico. Tente novamente.');
    }
};

export const exibirDetalhesBico = async (req, res) => {
    const { id } = req.params;
    const usuarioLogado = req.session?.usuario;

    if (!usuarioLogado) {
        return res.redirect('/login');
    }

    try {
        // 1. Busca os detalhes do bico
        const queryBico = `
            SELECT b.*, u.nome AS contratante_nome,
                   DATE_FORMAT(b.data_servico, '%d/%m/%Y') AS data_servico_formatada
            FROM bicos b
            JOIN usuarios u ON b.contratante_id = u.id
            WHERE b.id = ?
        `;

        const resBico = await db.query(queryBico, [id]);
        const bicos = Array.isArray(resBico?.[0]) ? resBico[0] : resBico;
        const bicoEncontrado = Array.isArray(bicos) ? bicos[0] : bicos;

        if (!bicoEncontrado) {
            return res.status(404).send('Bico não encontrado');
        }

        // 2. Checa se o usuário é trabalhador e se já se candidatou a este bico
        let minhaCandidatura = null;
        const trabalhador_id = usuarioLogado.id || usuarioLogado.id_usuario;

        if (trabalhador_id) {
            const queryCandidatura = `
                SELECT status, DATE_FORMAT(criado_em, '%d/%m/%Y') AS data_candidatura 
                FROM candidaturas 
                WHERE bico_id = ? AND trabalhador_id = ?
            `;
            const resCand = await db.query(queryCandidatura, [id, trabalhador_id]);
            const candidaturas = Array.isArray(resCand?.[0]) ? resCand[0] : resCand;
            minhaCandidatura = Array.isArray(candidaturas) ? candidaturas[0] : candidaturas;
        }

        return res.render('detalhesBico', {
            bico: bicoEncontrado,
            minhaCandidatura: minhaCandidatura || null,
            usuario: usuarioLogado
        });
    } catch (erro) {
        console.error('❌ Erro ao buscar detalhes do bico:', erro);
        return res.status(500).send('Erro interno do servidor ao carregar o bico.');
    }
};

export const exibirBicosAtivosContratante = async (req, res) => {
    if (!req.session?.usuario) {
        return res.redirect('/login');
    }

    try {
        const usuarioId = req.session.usuario.id;

        const bicosAtivos = await db.query(
            `SELECT 
                b.id,
                b.titulo,
                b.descricao,
                b.valor,
                DATE_FORMAT(b.data_servico, '%d/%m/%Y') AS data_servico_formatada,
                b.horario,
                b.bairro,
                b.status,
                u.nome AS nome_trabalhador
             FROM bicos b
             LEFT JOIN usuarios u ON b.trabalhador_id = u.id
             WHERE b.contratante_id = ? 
               AND b.status IN ('Aberto', 'Em andamento')
             ORDER BY b.data_servico ASC`,
            [usuarioId]
        );

        res.render('bicosAtivos', { bicos: bicosAtivos });
    } catch (error) {
        console.error('🚫 Erro ao buscar bicos ativos:', error);
        res.status(500).send('Erro ao carregar os bicos ativos.');
    }
};

// =========================================================================
// NOVAS FUNÇÕES PARA CANDIDATURAS E STATUS
// =========================================================================

// 1. Trabalhador se candidata a um bico (RF008)
export const candidatarAoBico = async (req, res) => {
    const { bico_id, mensagem } = req.body;

    // Trata a leitura do ID do trabalhador a partir da sessão
    const trabalhador_id = req.session?.usuario?.id || req.session?.usuario?.id_usuario;

    if (!trabalhador_id) {
        return res.redirect('/login');
    }

    const bicoIdNum = Number(bico_id);
    const trabalhadorIdNum = Number(trabalhador_id);

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Sem colchetes na desestruturação
        const resBicos = await connection.query(
            'SELECT * FROM bicos WHERE id = ? AND status = "Aberto"',
            [bicoIdNum]
        );

        // Trata a resposta vinda do banco
        const bicos = Array.isArray(resBicos[0]) ? resBicos[0] : resBicos;

        if (!bicos || bicos.length === 0) {
            await connection.rollback();
            return res.status(400).send('Este bico não está disponível para candidaturas.');
        }

        // 2. Insere a candidatura (sem colchetes em result)
        const resInsert = await connection.query(
            'INSERT INTO candidaturas (bico_id, trabalhador_id, mensagem, status) VALUES (?, ?, ?, "Pendente")',
            [bicoIdNum, trabalhadorIdNum, mensagem || null]
        );

        const result = Array.isArray(resInsert[0]) ? resInsert[0] : resInsert;
        const candidaturaId = result.insertId;

        // 3. Insere o histórico de candidatura
        await connection.query(
            `INSERT INTO historico_candidaturas (candidatura_id, status_anterior, status_novo, alterado_por, observacao)
             VALUES (?, NULL, 'Pendente', ?, 'Trabalhador candidatou-se à vaga')`,
            [candidaturaId, trabalhadorIdNum]
        );

        await connection.commit();
        return res.redirect('/hometrabalhador');

    } catch (erro) {
        await connection.rollback();
        console.error('❌ DETALHE DO ERRO AO CANDIDATAR:', erro);

        if (erro.code === 'ER_DUP_ENTRY') {
            return res.status(400).send('Você já se candidatou a este bico!');
        }

        return res.status(500).send('Erro interno ao processar candidatura.');
    } finally {
        connection.release();
    }
};


// 2. Contratante lista candidatos de um bico específico (RF005)
export const criarListadorCandidatosBico = (banco) => async (req, res) => {
    const { bico_id } = req.params;
    const contratante_id = req.session?.usuario?.id;

    if (!contratante_id) {
        return res.redirect('/login');
    }

    try {
        const query = `
            SELECT 
                c.id AS candidatura_id,
                c.status AS status_candidatura,
                c.mensagem,
                DATE_FORMAT(c.criado_em, '%d/%m/%Y %H:%i') AS data_candidatura_formatada,
                u.id AS trabalhador_id,
                u.nome AS nome_trabalhador,
                u.email AS email_trabalhador,
                u.idade AS idade_trabalhador
            FROM candidaturas c
            JOIN usuarios u ON c.trabalhador_id = u.id
            JOIN bicos b ON c.bico_id = b.id
            WHERE c.bico_id = ? AND b.contratante_id = ?
            ORDER BY c.criado_em DESC
        `;

        const candidatos = await banco.query(query, [bico_id, contratante_id]);
        return res.render('candidatosBico', { candidatos, bico_id });
    } catch (erro) {
        console.error('❌ Erro ao listar candidatos:', erro);
        return res.status(500).send('Erro ao buscar candidatos.');
    }
};

// 3. Contratante escolhe ou recusa um candidato (RF005 / US13)
const obterLinhas = (resultado) => (
    Array.isArray(resultado?.[0]) ? resultado[0] : resultado
);

const obterPrimeiraLinha = (resultado) => {
    const linhas = obterLinhas(resultado);
    return Array.isArray(linhas) ? linhas[0] : linhas;
};

// Factory para manter a operação testável com uma conexão isolada.
export const criarAtualizadorStatusCandidatura = (banco) => async (req, res) => {
    const { candidatura_id, novo_status, observacao } = req.body || {};
    const usuario_id = req.session?.usuario?.id || req.session?.usuario?.id_usuario;

    if (!usuario_id) {
        return res.redirect('/login');
    }

    const candidaturaIdNum = typeof candidatura_id === 'number'
        ? candidatura_id
        : typeof candidatura_id === 'string' && candidatura_id.trim() !== ''
            ? Number(candidatura_id)
            : NaN;
    const usuarioIdNum = Number(usuario_id);

    if (!Number.isInteger(candidaturaIdNum) || candidaturaIdNum <= 0) {
        return res.status(400).send('Identificador de candidatura inválido.');
    }

    if (!Number.isInteger(usuarioIdNum) || usuarioIdNum <= 0) {
        return res.status(400).send('Identificador de usuário inválido.');
    }

    if (observacao != null && (typeof observacao !== 'string' || [...observacao].length > 255)) {
        return res.status(400).send('A observação deve ter no máximo 255 caracteres.');
    }

    if (!['Aceito', 'Recusado'].includes(novo_status)) {
        return res.status(400).send('Status inválido.');
    }

    let connection;
    let transacaoAtiva = false;

    const responderComRollback = async (status, mensagem) => {
        await connection.rollback();
        transacaoAtiva = false;
        return res.status(status).send(mensagem);
    };

    try {
        connection = await banco.getConnection();
        await connection.beginTransaction();
        transacaoAtiva = true;

        // Localiza o bico sem bloquear candidaturas, para respeitar a ordem de locks.
        const resultadoInicial = await connection.query(
            'SELECT bico_id FROM candidaturas WHERE id = ?',
            [candidaturaIdNum]
        );
        const candidaturaInicial = obterPrimeiraLinha(resultadoInicial);

        if (!candidaturaInicial) {
            return await responderComRollback(404, 'Candidatura não encontrada.');
        }

        const bicoId = candidaturaInicial.bico_id;

        // As decisões do mesmo bico sempre bloqueiam primeiro esta linha.
        const resultadoBico = await connection.query(
            'SELECT id, contratante_id, status FROM bicos WHERE id = ? FOR UPDATE',
            [bicoId]
        );
        const bico = obterPrimeiraLinha(resultadoBico);

        if (!bico) {
            return await responderComRollback(404, 'Bico não encontrado.');
        }

        if (Number(bico.contratante_id) !== usuarioIdNum) {
            return await responderComRollback(403, 'Você não tem autorização para alterar esta candidatura.');
        }

        // O bico permanece bloqueado até o commit; depois bloqueamos a candidatura.
        const resultadoCandidatura = await connection.query(
            'SELECT * FROM candidaturas WHERE id = ? AND bico_id = ? FOR UPDATE',
            [candidaturaIdNum, bicoId]
        );
        const candidatura = obterPrimeiraLinha(resultadoCandidatura);

        if (!candidatura) {
            return await responderComRollback(404, 'Candidatura não encontrada.');
        }

        if (candidatura.status !== 'Pendente') {
            return await responderComRollback(400, 'Esta candidatura já foi processada.');
        }

        if (bico.status !== 'Aberto') {
            return await responderComRollback(400, 'Este bico não está mais aberto.');
        }

        await connection.query(
            "UPDATE candidaturas SET status = ? WHERE id = ? AND status = 'Pendente'",
            [novo_status, candidaturaIdNum]
        );

        await connection.query(
            `INSERT INTO historico_candidaturas (candidatura_id, status_anterior, status_novo, alterado_por, observacao)
             VALUES (?, ?, ?, ?, ?)`,
            [candidaturaIdNum, candidatura.status, novo_status, usuarioIdNum, observacao || null]
        );

        if (novo_status === 'Aceito') {
            await connection.query(
                "UPDATE bicos SET trabalhador_id = ?, status = 'Em andamento' WHERE id = ?",
                [candidatura.trabalhador_id, bicoId]
            );

            const resultadoPendentes = await connection.query(
                `SELECT id FROM candidaturas
                 WHERE bico_id = ? AND id <> ? AND status = 'Pendente'
                 ORDER BY id FOR UPDATE`,
                [bicoId, candidaturaIdNum]
            );
            const candidaturasPendentes = obterLinhas(resultadoPendentes) || [];
            const observacaoAutomatica = 'Recusada automaticamente após a aceitação de outra candidatura.';

            for (const pendente of candidaturasPendentes) {
                await connection.query(
                    "UPDATE candidaturas SET status = 'Recusado' WHERE id = ? AND status = 'Pendente'",
                    [pendente.id]
                );
                await connection.query(
                    `INSERT INTO historico_candidaturas (candidatura_id, status_anterior, status_novo, alterado_por, observacao)
                     VALUES (?, 'Pendente', 'Recusado', ?, ?)`,
                    [pendente.id, usuarioIdNum, observacaoAutomatica]
                );
            }
        }

        await connection.commit();
        transacaoAtiva = false;
        return res.redirect(`/bicos/${bicoId}/gerenciar`);
    } catch (erro) {
        if (connection && transacaoAtiva) {
            try {
                await connection.rollback();
            } catch (erroRollback) {
                console.error('Erro ao reverter transação de candidatura:', erroRollback);
            }
        }

        console.error('ERRO AO ATUALIZAR STATUS DA CANDIDATURA:', erro);
        return res.status(500).send('Erro interno ao atualizar candidatura.');
    } finally {
        connection?.release();
    }
};

export const listarCandidatosBico = criarListadorCandidatosBico(db);

export const atualizarStatusCandidatura = criarAtualizadorStatusCandidatura(db);

export const finalizarBico = async (req, res) => {
    const bicoIdNum = typeof req.params?.id === 'string' && req.params.id.trim() !== ''
        ? Number(req.params.id)
        : NaN;
    const usuarioIdNum = Number(req.session?.usuario?.id || req.session?.usuario?.id_usuario);

    if (!Number.isInteger(bicoIdNum) || bicoIdNum <= 0) {
        return res.status(400).json({ sucesso: false, erro: 'Identificador de bico inválido.' });
    }

    if (!Number.isInteger(usuarioIdNum) || usuarioIdNum <= 0) {
        return res.status(401).json({ sucesso: false, erro: 'Autenticação necessária.' });
    }

    let connection;
    let transacaoAtiva = false;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        transacaoAtiva = true;

        const resultadoBico = await connection.query(
            'SELECT id, contratante_id, status FROM bicos WHERE id = ? FOR UPDATE',
            [bicoIdNum]
        );
        const bico = obterPrimeiraLinha(resultadoBico);

        if (!bico) {
            await connection.rollback();
            transacaoAtiva = false;
            return res.status(404).json({ sucesso: false, erro: 'Bico não encontrado.' });
        }

        if (Number(bico.contratante_id) !== usuarioIdNum) {
            await connection.rollback();
            transacaoAtiva = false;
            return res.status(403).json({ sucesso: false, erro: 'Você não tem autorização para finalizar este bico.' });
        }

        if (bico.status !== 'Em andamento') {
            await connection.rollback();
            transacaoAtiva = false;
            return res.status(409).json({ sucesso: false, erro: 'Somente bicos em andamento podem ser finalizados.' });
        }

        const resultadoAtualizacao = await connection.query(
            "UPDATE bicos SET status = 'Finalizado' WHERE id = ? AND contratante_id = ? AND status = 'Em andamento'",
            [bicoIdNum, usuarioIdNum]
        );

        if (resultadoAtualizacao.affectedRows !== 1) {
            await connection.rollback();
            transacaoAtiva = false;
            return res.status(409).json({ sucesso: false, erro: 'O status do bico mudou. Atualize a página e tente novamente.' });
        }

        await connection.query(
            `INSERT INTO historico_eventos_bicos
                (bico_id, usuario_id, tipo_evento, status_anterior, status_novo)
             VALUES (?, ?, 'Finalizacao', ?, 'Finalizado')`,
            [bicoIdNum, usuarioIdNum, bico.status]
        );

        await connection.commit();
        transacaoAtiva = false;
        return res.json({ sucesso: true, mensagem: 'Serviço finalizado com sucesso.', status: 'Finalizado' });
    } catch (erro) {
        if (connection && transacaoAtiva) {
            try {
                await connection.rollback();
            } catch (erroRollback) {
                console.error('Erro ao reverter transação de finalização do bico:', erroRollback);
            }
        }

        console.error('ERRO AO FINALIZAR BICO:', erro);
        return res.status(500).json({ sucesso: false, erro: 'Erro interno ao finalizar o bico.' });
    } finally {
        connection?.release();
    }
};

export const salvarAvaliacaoBico = async (req, res) => {
    const bicoIdNum = typeof req.params?.id === 'string' && req.params.id.trim() !== ''
        ? Number(req.params.id)
        : NaN;
    const usuario = req.session?.usuario;
    const perfil = typeof usuario?.tipo_perfil === 'string'
        ? usuario.tipo_perfil.trim().toLowerCase()
        : '';
    const usuarioIdNum = Number(usuario?.id || usuario?.id_usuario);

    if (!Number.isInteger(bicoIdNum) || bicoIdNum <= 0) {
        return res.status(400).json({ sucesso: false, erro: 'Identificador de bico inválido.' });
    }

    if (!usuario || !Number.isInteger(usuarioIdNum) || usuarioIdNum <= 0) {
        return res.status(401).json({ sucesso: false, erro: 'Autenticação necessária.' });
    }

    if (perfil !== 'contratante') {
        return res.status(403).json({ sucesso: false, erro: 'Apenas contratantes podem avaliar este serviço.' });
    }

    const notaRecebida = req.body?.nota;
    const nota = typeof notaRecebida === 'number'
        ? notaRecebida
        : typeof notaRecebida === 'string' && /^[1-5]$/.test(notaRecebida)
            ? Number(notaRecebida)
            : NaN;

    if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
        return res.status(400).json({ sucesso: false, erro: 'A nota deve ser um número inteiro de 1 a 5.' });
    }

    const comentarioRecebido = req.body?.comentario;
    if (comentarioRecebido !== undefined && comentarioRecebido !== null && typeof comentarioRecebido !== 'string') {
        return res.status(400).json({ sucesso: false, erro: 'O comentário deve ser um texto de até 500 caracteres.' });
    }

    const comentario = comentarioRecebido ?? null;
    if (comentario !== null && Array.from(comentario).length > 500) {
        return res.status(400).json({ sucesso: false, erro: 'O comentário deve ter no máximo 500 caracteres.' });
    }

    try {
        const resultadoBico = await db.query(
            'SELECT contratante_id, trabalhador_id, status FROM bicos WHERE id = ?',
            [bicoIdNum]
        );
        const bico = obterPrimeiraLinha(resultadoBico);

        if (!bico) {
            return res.status(404).json({ sucesso: false, erro: 'Bico não encontrado.' });
        }

        if (Number(bico.contratante_id) !== usuarioIdNum) {
            return res.status(403).json({ sucesso: false, erro: 'Você não tem autorização para avaliar este bico.' });
        }

        if (bico.status !== 'Finalizado') {
            return res.status(409).json({ sucesso: false, erro: 'Somente bicos finalizados podem ser avaliados.' });
        }

        const trabalhadorIdNum = Number(bico.trabalhador_id);
        if (!Number.isInteger(trabalhadorIdNum) || trabalhadorIdNum <= 0) {
            return res.status(409).json({ sucesso: false, erro: 'Este bico não possui um trabalhador associado.' });
        }

        await db.query(
            `INSERT INTO avaliacoes (bico_id, avaliador_id, avaliado_id, nota, comentario)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                avaliador_id = VALUES(avaliador_id),
                avaliado_id = VALUES(avaliado_id),
                nota = VALUES(nota),
                comentario = VALUES(comentario)`,
            [bicoIdNum, usuarioIdNum, trabalhadorIdNum, nota, comentario]
        );

        return res.json({ sucesso: true, mensagem: 'Avaliação salva com sucesso.' });
    } catch (erro) {
        if (erro?.code === 'ER_DUP_ENTRY' || erro?.errno === 1062) {
            return res.status(409).json({ sucesso: false, erro: 'Não foi possível salvar a avaliação devido a um conflito. Tente novamente.' });
        }

        console.error('ERRO AO SALVAR AVALIAÇÃO DO BICO:', erro);
        return res.status(500).json({ sucesso: false, erro: 'Erro interno ao salvar a avaliação.' });
    }
};

// 4. Exibir o histórico apenas para o contratante do bico ou seu trabalhador.
export const criarExibidorHistoricoCandidatura = (banco) => async (req, res) => {
    const { candidatura_id } = req.params || {};
    const usuario = req.session?.usuario;

    if (!usuario) {
        return res.redirect('/login');
    }

    const candidaturaIdNum = typeof candidatura_id === 'number'
        ? candidatura_id
        : typeof candidatura_id === 'string' && candidatura_id.trim() !== ''
            ? Number(candidatura_id)
            : NaN;
    const usuarioIdNum = Number(usuario.id || usuario.id_usuario);
    const perfil = typeof usuario.tipo_perfil === 'string'
        ? usuario.tipo_perfil.trim().toLowerCase()
        : '';

    if (!Number.isInteger(candidaturaIdNum) || candidaturaIdNum <= 0) {
        return res.status(400).send('Identificador de candidatura inválido.');
    }

    if (!Number.isInteger(usuarioIdNum) || usuarioIdNum <= 0) {
        return res.redirect('/login');
    }

    if (!['contratante', 'trabalhador'].includes(perfil)) {
        return res.status(403).send('Acesso não autorizado.');
    }

    try {
        const consultaAcesso = `
            SELECT c.id
            FROM candidaturas c
            JOIN bicos b ON b.id = c.bico_id
            WHERE c.id = ?
              AND ((? = 'contratante' AND b.contratante_id = ?)
                OR (? = 'trabalhador' AND c.trabalhador_id = ?))
        `;
        const resultadoAcesso = await banco.query(consultaAcesso, [
            candidaturaIdNum,
            perfil,
            usuarioIdNum,
            perfil,
            usuarioIdNum
        ]);
        const candidaturaAutorizada = obterPrimeiraLinha(resultadoAcesso);

        // 404 para inexistente e sem vínculo evita confirmar dados de terceiros.
        if (!candidaturaAutorizada) {
            return res.status(404).send('Histórico não encontrado.');
        }

        const consultaHistorico = `
            SELECT 
                h.status_anterior,
                h.status_novo,
                u.nome AS alterado_por_nome,
                h.observacao,
                DATE_FORMAT(h.data_alteracao, '%d/%m/%Y %H:%i') AS data_alteracao_formatada
            FROM historico_candidaturas h
            JOIN usuarios u ON h.alterado_por = u.id
            WHERE h.candidatura_id = ?
            ORDER BY h.data_alteracao ASC
        `;
        const resultadoHistorico = await banco.query(consultaHistorico, [candidaturaIdNum]);
        const historico = obterLinhas(resultadoHistorico);

        return res.json(Array.isArray(historico) ? historico : []);
    } catch (erro) {
        console.error('❌ Erro ao buscar histórico da candidatura:', erro);
        return res.status(500).send('Erro ao carregar o histórico.');
    }
};

export const exibirHistoricoCandidatura = criarExibidorHistoricoCandidatura(db);

// Exibe a tela de gerenciamento do bico para o Contratante
export const exibirGerenciamentoBico = async (req, res) => {
    const { id } = req.params;

    // Garante a leitura correta do ID da sessão (ajuste se seu objeto usar id_usuario)
    const contratante_id = req.session?.usuario?.id || req.session?.usuario?.id_usuario;

    if (!contratante_id) {
        return res.redirect('/login');
    }

    try {
        // 1. Converte ambos para inteiros para evitar falhas de comparação no SQL
        const bicoIdNum = Number(id);
        const contratanteIdNum = Number(contratante_id);

        const queryBico = `
            SELECT b.*, DATE_FORMAT(b.data_servico, '%d/%m/%Y') AS data_servico_formatada
            FROM bicos b
            WHERE b.id = ? AND b.contratante_id = ?
        `;

        const resultado = await db.query(queryBico, [bicoIdNum, contratanteIdNum]);

        // Trata o retorno caso venha aninhado pelo driver do MySQL
        const bicos = Array.isArray(resultado?.[0]) ? resultado[0] : resultado;
        const bicoEncontrado = Array.isArray(bicos) ? bicos[0] : bicos;

        if (!bicoEncontrado) {
            console.log(`⚠️ Bico ID ${bicoIdNum} não encontrado para o Contratante ID ${contratanteIdNum}`);
            return res.status(404).send('Bico não encontrado ou você não tem permissão para acessá-lo.');
        }

        // 2. Busca a lista de candidatos
        const queryCandidatos = `
            SELECT 
                c.id AS candidatura_id,
                c.status AS status_candidatura,
                c.mensagem,
                DATE_FORMAT(c.criado_em, '%d/%m/%Y %H:%i') AS data_candidatura_formatada,
                u.id AS trabalhador_id,
                u.nome AS nome_trabalhador,
                u.email AS email_trabalhador,
                u.idade AS idade_trabalhador
            FROM candidaturas c
            JOIN usuarios u ON c.trabalhador_id = u.id
            WHERE c.bico_id = ?
            ORDER BY c.criado_em DESC
        `;

        const resCandidatos = await db.query(queryCandidatos, [bicoIdNum]);
        const candidatos = Array.isArray(resCandidatos?.[0]) ? resCandidatos[0] : resCandidatos;

        return res.render('gerenciarBico', {
            bico: bicoEncontrado,
            candidatos: Array.isArray(candidatos) ? candidatos : [],
            usuario: req.session.usuario
        });
    } catch (erro) {
        console.error('❌ Erro ao carregar gerenciamento do bico:', erro);
        return res.status(500).send('Erro interno do servidor.');
    }
};
// Cancelar a candidatura do bico

export const cancelarCandidatura = async (req, res) => {
    const { bico_id } = req.body ?? {};

    const trabalhadorId = req.session?.usuario?.id
        ?? req.session?.usuario?.id_usuario;

    const bicoIdNum =
        typeof bico_id === 'number'
            ? bico_id
            : typeof bico_id === 'string' && bico_id.trim() !== ''
                ? Number(bico_id)
                : NaN;

    const trabalhadorIdNum = Number(trabalhadorId);

    // 1. Valida o ID do bico
    if (!Number.isSafeInteger(bicoIdNum) || bicoIdNum <= 0) {
        return res.status(400).send('Identificador de bico inválido.');
    }

    // 2. Confere a identificação do trabalhador
    if (!Number.isSafeInteger(trabalhadorIdNum) || trabalhadorIdNum <= 0) {
        return res.redirect('/login');
    }

    let connection;
    let transacaoAtiva = false;

    try {
        connection = await db.getConnection();

        await connection.beginTransaction();
        transacaoAtiva = true;

        // 3. Busca somente a candidatura do próprio trabalhador
        const resCand = await connection.query(
            `SELECT id
             FROM candidaturas
             WHERE bico_id = ?
               AND trabalhador_id = ?
               AND status = 'Pendente'
             FOR UPDATE`,
            [bicoIdNum, trabalhadorIdNum]
        );

        const candidaturas = Array.isArray(resCand[0])
            ? resCand[0]
            : resCand;

        const candidatura = candidaturas[0];

        if (!candidatura) {
            await connection.rollback();
            transacaoAtiva = false;

            return res.status(400).send(
                'Candidatura não encontrada ou não pode mais ser cancelada.'
            );
        }

        // 4. Cancela somente se continuar pendente
        const resultado = await connection.query(
            `UPDATE candidaturas
             SET status = 'Cancelado'
             WHERE id = ?
               AND trabalhador_id = ?
               AND status = 'Pendente'`,
            [candidatura.id, trabalhadorIdNum]
        );

        if (resultado.affectedRows !== 1) {
            await connection.rollback();
            transacaoAtiva = false;

            return res.status(409).send(
                'A candidatura mudou de estado. Atualize a página e tente novamente.'
            );
        }

        // 5. Registra a alteração no histórico

        await connection.query(
            `INSERT INTO historico_candidaturas
                (candidatura_id, status_anterior, status_novo,
                 alterado_por, observacao)
             VALUES (?, 'Pendente', 'Cancelado', ?, ?)`,
            [
                candidatura.id,
                trabalhadorIdNum,
                'Candidatura cancelada pelo próprio trabalhador'
            ]
        );
        // 6. Confirma as duas alterações
        await connection.commit();
        transacaoAtiva = false;

        return res.redirect(`/bicos/${bicoIdNum}`);

    } catch (erro) {
        if (connection && transacaoAtiva) {
            try {
                await connection.rollback();
            } catch (erroRollback) {
                console.error(
                    'Erro ao reverter cancelamento da candidatura:',
                    erroRollback
                );
            }
        }

        console.error('Erro ao cancelar candidatura:', erro);

        return res.status(500).send(
            'Erro interno ao cancelar candidatura.'
        );
    } finally {
        connection?.release();
    }
};

