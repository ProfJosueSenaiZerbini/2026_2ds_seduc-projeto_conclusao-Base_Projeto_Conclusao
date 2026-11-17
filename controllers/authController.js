import pool from '../config/database.js';
import bcrypt from 'bcrypt';
import { SQL_FINALIZADO_EM, contarBicosParaAvaliar, montarSeloAvaliacao } from './avaliacaoRegras.js';
import {
    normalizarCPF,
    validarConfirmacaoSenha,
    validarEmail,
    validarIdade,
    validarNome,
    validarSenha
} from '../validations/usuarioValidation.js';

export const criarCadastradorUsuario = (banco, hasher = bcrypt) => async (req, res) => {
    const body = req.body || {};

    const mostrarErro = (mensagem, status = 400) => {
        return res.status(status).render('cadastrar', {
            erro: mensagem,
            dados: {
                nome,
                email,
                cpf: cpfInformado,
                idade: idadeInformada,
                tipoPerfil: tipoPerfilRecebido
            }
        });
    };

    const nome = typeof body.nome === 'string' ? body.nome.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const cpfInformado = typeof body.cpf === 'string' ? body.cpf.trim() : '';
    const idadeInformada = typeof body.idade === 'string' ? body.idade.trim() : '';
    const tipoPerfilRecebido = typeof body.tipoPerfil === 'string' ? body.tipoPerfil.trim().toLowerCase() : '';
    const tipoPerfil = ['contratante', 'trabalhador'].includes(tipoPerfilRecebido) ? tipoPerfilRecebido : null;

    if (!nome || !email || !cpfInformado) {
        return mostrarErro('Preencha nome, e-mail e CPF.');
    }

    if (!validarEmail(email)) {
        return mostrarErro('Digite um e-mail válido.');
    }

    // --- AJUSTE AQUI PARA ACEITAR CPFS ALEATÓRIOS DE 1 A 9 OU O VALIDADOR NORMAL ---
    const cpfLimpo = cpfInformado.replace(/\D/g, ''); // Remove pontos e traços para validação
    
    // Verifica se o CPF gerado é um CPF de teste composto apenas por dígitos de 1 a 9 (com 11 dígitos)
    const eCpfAleatorioDeUmAUm = /^[1-9]{11}$/.test(cpfLimpo);

    let cpf;
    if (process.env.NODE_ENV === 'development' && eCpfAleatorioDeUmAUm) {
        // Se estiver em ambiente de desenvolvimento e for um CPF aleatório de 1 a 9, aceita direto (mantendo limpo ou formatado)
        cpf = cpfLimpo; 
    } else {
        // Caso contrário, roda a validação e normalização padrão do sistema
        cpf = normalizarCPF(cpfInformado);
    }

    if (!cpf) {
        return mostrarErro('Digite um CPF válido.');
    }
    // -----------------------------------------------------------------------------

    if (!validarNome(nome, 3)) {
        return mostrarErro('O nome deve ter entre 3 e 100 caracteres.');
    }

    if (!validarIdade(idadeInformada)) {
        return mostrarErro('Informe uma idade válida, entre 18 e 90 anos.');
    }

    if (!validarSenha(body.senha)) {
        return mostrarErro('A senha deve ter ao menos 6 caracteres e no máximo 72 bytes.');
    }

    if (typeof body.confirmarSenha !== 'string' || !body.confirmarSenha) {
        return mostrarErro('A confirmação da senha é obrigatória.');
    }

    if (!validarConfirmacaoSenha(body.senha, body.confirmarSenha)) {
        return mostrarErro('As senhas não coincidem.');
    }

    if (!tipoPerfil) {
        return mostrarErro('Tipo de usuário inválido.');
    }

    if (!['on', 'true', '1', true].includes(body.termos)) {
        return mostrarErro('É necessário aceitar os termos de uso e a política de privacidade.');
    }

    if (!['on', 'true', '1', true].includes(body.maiorIdade)) {
        return mostrarErro('É necessário confirmar que possui 18 anos ou mais.');
    }

    try {
        const usuarioExistente = await banco.query(
            'SELECT id FROM usuarios WHERE email = ? OR cpf = ? OR cpf = ?',
            [email, cpf, cpf.replace(/\D/g, '')]
        );

        if (usuarioExistente.length > 0) {
            return mostrarErro('E-mail ou CPF já cadastrado no sistema.', 409);
        }

        const salt = await hasher.genSalt(10);
        const senhaCriptografada = await hasher.hash(body.senha, salt);

        await banco.query(
            `INSERT INTO usuarios (nome, email, cpf, idade, senha, tipo_perfil)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [nome, email, cpf, Number(idadeInformada), senhaCriptografada, tipoPerfil]
        );

        return res.redirect('/login');
    } catch (erro) {
        if (erro?.code === 'ER_DUP_ENTRY' || erro?.errno === 1062) {
            return mostrarErro('E-mail ou CPF já cadastrado no sistema.', 409);
        }
        console.error('Erro interno durante cadastro:', erro?.code || 'erro inesperado');
        return mostrarErro('Erro interno ao tentar cadastrar.', 500);
    }
};

export const cadastrarUsuario = criarCadastradorUsuario(pool, bcrypt);

export const criarAutenticadorUsuario = (banco, hasher = bcrypt) => async (req, res) => {
    const body = req.body || {};

    const mostrarErro = (mensagem, status = 400) => {
        return res.status(status).render('login', {
            erro: mensagem,
            // Mantém o perfil escolhido (Contratar/Trabalhar) depois de um erro.
            tipoPerfil: String(body.tipoPerfil || '').toLowerCase() === 'trabalhador' ? 'trabalhador' : 'contratante',
        });
    };

    const emailLimpo = typeof body.email === 'string'
        ? body.email.trim().toLowerCase()
        : '';

    const senha = body.senha;
    const tipoPerfil = body.tipoPerfil;

    if (!emailLimpo) {
        return mostrarErro('Preencha o e-mail.');
    }

    if (!validarEmail(emailLimpo)) {
        return mostrarErro('Digite um e-mail válido.');
    }

    if (typeof senha !== 'string' || !senha) {
        return mostrarErro('Preencha a senha.');
    }

    try {
        const usuarios = await banco.query(
            'SELECT id, nome, email, cpf, senha, tipo_perfil, saldo_simulado FROM usuarios WHERE email = ?',
            [emailLimpo]
        );

        if (!usuarios || usuarios.length === 0) {
            return mostrarErro('E-mail não cadastrado!');
        }

        const usuario = usuarios[0];

        if (!usuario || !usuario.senha) {
            console.error('Erro: consulta de login retornou um usuário sem senha.');
            return mostrarErro('Erro ao processar os dados do usuário.');
        }

        // Comparação da senha criptografada
        const senhaValida = await hasher.compare(senha, usuario.senha);
        if (!senhaValida) {
            return mostrarErro('Senha incorreta!');
        }

        // Validação de tipo de perfil (se selecionado na tela de login)
        if (tipoPerfil && usuario.tipo_perfil.toLowerCase() !== tipoPerfil.toLowerCase()) {
            return mostrarErro(`Sua conta está cadastrada como ${usuario.tipo_perfil}. Alterne a opção para continuar.`);
        }

        // Salva os dados do usuário na sessão
        req.session.usuario = {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            cpf: usuario.cpf,
            tipo_perfil: usuario.tipo_perfil,
            saldo_simulado: usuario.saldo_simulado
        };

        if (usuario.tipo_perfil.toLowerCase() === 'trabalhador') {
            return res.redirect('/hometrabalhador');
        }

        return res.redirect('/homeContratante');

    } catch (error) {
        console.error('Erro no login:', error?.code || 'erro inesperado');
        return res.status(500).send('Erro interno do servidor ao tentar logar.');
    }
};

export const logarUsuario = criarAutenticadorUsuario(pool, bcrypt);

export const homeContratante = async (req, res) => {
    try {
        if (!req.session?.usuario) {
            return res.redirect('/login');
        }

        const contratanteId = req.session.usuario.id;
        const usuarios = await pool.query(
            'SELECT nome, saldo_simulado FROM usuarios WHERE id = ?',
            [contratanteId]
        );
        const usuario = usuarios[0];

        const bicos = await pool.query(
            'SELECT id, titulo, descricao, valor, bairro, status FROM bicos WHERE contratante_id = ? ORDER BY id DESC',
            [contratanteId]
        );
        const resultadoCandidaturas = await pool.query(
            `SELECT COUNT(*) AS total
             FROM candidaturas c
             JOIN bicos b ON b.id = c.bico_id
             WHERE b.contratante_id = ? AND c.status = 'Pendente'`,
            [contratanteId]
        );
        const candidaturasPendentes = Number(resultadoCandidaturas[0]?.total || 0);

        // "Aguardando sua avaliação": bicos finalizados que este contratante ainda não avaliou e cujo
        // prazo de avaliação (PRAZO_AVALIACAO_DIAS dias após a finalização) não terminou.
        const bicosParaAvaliar = await contarBicosParaAvaliar(pool, 'contratante_id', contratanteId);
        const bicosAtivos = bicos.filter(
            bico => bico.status === 'Aberto' || bico.status === 'Em andamento'
        );
        const bicosEmAndamento = bicos.filter(
            bico => bico.status === 'Em andamento'
        ).length;

        return res.render('contratante/homeContratante', {
            usuario,
            bicos,
            bicosAtivos,
            candidaturasPendentes,
            bicosParaAvaliar,
            bicosEmAndamento
        });
    } catch (erro) {
        console.error('Erro ao carregar dashboard do contratante:', erro);
        return res.status(500).send('Erro interno ao carregar a página.');
    }
};

export const exibirHistoricoTrabalhador = async (req, res) => {
    const trabalhador_id = req.session?.usuario?.id || req.session?.usuario?.id_usuario;

    if (!trabalhador_id) {
        return res.redirect('/login');
    }

    try {
        // Todas as consultas trazem horário, bairro e nome do contratante (cliente) para o card.
        // data_servico_iso (AAAA-MM-DD) é a data do serviço; a ordenação do histórico vem de candidatura_ordem_ts
        // (evento da candidatura) e a data do serviço só serve de alternativa no card quando esse campo não existe.
        const queryAceitos = `
            SELECT
                c.id AS candidatura_id,
                UNIX_TIMESTAMP(COALESCE((SELECT MAX(hx.data_alteracao) FROM historico_candidaturas hx WHERE hx.candidatura_id = c.id AND hx.status_novo = 'Aceito'), c.atualizado_em)) AS candidatura_ordem_ts,
                DATE_FORMAT(c.criado_em, '%d/%m/%Y %H:%i') AS candidatura_criada_formatada,
                DATE_FORMAT(c.atualizado_em, '%d/%m/%Y %H:%i') AS candidatura_atualizada_formatada,
                b.id AS bico_id,
                b.titulo,
                b.descricao,
                b.valor,
                b.status AS bico_status,
                b.horario,
                b.bairro AS local,
                u.nome AS cliente_nome,
                u.id AS cliente_id,
                (SELECT ROUND(AVG(av.nota), 1) FROM avaliacoes av WHERE av.avaliado_id = u.id) AS cliente_nota,
                (SELECT COUNT(*) FROM avaliacoes av WHERE av.avaliado_id = u.id) AS cliente_total_avaliacoes,
                DATE_FORMAT(b.data_servico, '%d/%m/%Y') AS data_servico_formatada,
                DATE_FORMAT(b.data_servico, '%Y-%m-%d') AS data_servico_iso,
                c.status AS candidatura_status
            FROM candidaturas c
            JOIN bicos b ON c.bico_id = b.id
            JOIN usuarios u ON u.id = b.contratante_id
            WHERE c.trabalhador_id = ? AND c.status = 'Aceito' AND b.status NOT IN ('Finalizado', 'Cancelado')
            ORDER BY candidatura_ordem_ts DESC, c.id DESC
        `;

        // Candidatura continua 'Aceito' após a finalização; o que muda é o status do bico.
        // Ordenação dos concluídos: data/hora do evento real de finalização (historico_eventos_bicos); sem evento, cai na
        // data de aceitação (critério anterior). A subconsulta traz só o evento mais recente, sem duplicar candidaturas.
        const queryConcluidos = `
            SELECT
                c.id AS candidatura_id,
                UNIX_TIMESTAMP(COALESCE(ef.data_evento, COALESCE((SELECT MAX(hx.data_alteracao) FROM historico_candidaturas hx WHERE hx.candidatura_id = c.id AND hx.status_novo = 'Aceito'), c.atualizado_em))) AS candidatura_ordem_ts,
                DATE_FORMAT(ef.data_evento, '%d/%m/%Y %H:%i') AS finalizacao_formatada,
                DATE_FORMAT(c.criado_em, '%d/%m/%Y %H:%i') AS candidatura_criada_formatada,
                DATE_FORMAT(c.atualizado_em, '%d/%m/%Y %H:%i') AS candidatura_atualizada_formatada,
                b.id AS bico_id,
                b.titulo,
                b.descricao,
                b.valor,
                b.status AS bico_status,
                b.horario,
                b.bairro AS local,
                u.nome AS cliente_nome,
                u.id AS cliente_id,
                (SELECT ROUND(AVG(av.nota), 1) FROM avaliacoes av WHERE av.avaliado_id = u.id) AS cliente_nota,
                (SELECT COUNT(*) FROM avaliacoes av WHERE av.avaliado_id = u.id) AS cliente_total_avaliacoes,
                DATE_FORMAT(b.data_servico, '%d/%m/%Y') AS data_servico_formatada,
                DATE_FORMAT(b.data_servico, '%Y-%m-%d') AS data_servico_iso,
                c.status AS candidatura_status,
                (SELECT av.nota FROM avaliacoes av WHERE av.bico_id = b.id AND av.avaliador_id = c.trabalhador_id) AS minha_nota,
                ${SQL_FINALIZADO_EM} AS finalizado_em_raw
            FROM candidaturas c
            JOIN bicos b ON c.bico_id = b.id
            JOIN usuarios u ON u.id = b.contratante_id
            LEFT JOIN historico_eventos_bicos ef ON ef.id = (
                SELECT e2.id FROM historico_eventos_bicos e2
                WHERE e2.bico_id = b.id AND e2.tipo_evento = 'Finalizacao' AND e2.status_novo = 'Finalizado'
                ORDER BY e2.data_evento DESC, e2.id DESC LIMIT 1
            )
            WHERE c.trabalhador_id = ? AND c.status = 'Aceito' AND b.status = 'Finalizado'
            ORDER BY candidatura_ordem_ts DESC, c.id DESC
        `;

        const queryPendentes = `
            SELECT
                c.id AS candidatura_id,
                UNIX_TIMESTAMP(c.criado_em) AS candidatura_ordem_ts,
                DATE_FORMAT(c.criado_em, '%d/%m/%Y %H:%i') AS candidatura_criada_formatada,
                DATE_FORMAT(c.atualizado_em, '%d/%m/%Y %H:%i') AS candidatura_atualizada_formatada,
                b.id AS bico_id,
                b.titulo,
                b.descricao,
                b.valor,
                b.status AS bico_status,
                b.horario,
                b.bairro AS local,
                u.nome AS cliente_nome,
                u.id AS cliente_id,
                (SELECT ROUND(AVG(av.nota), 1) FROM avaliacoes av WHERE av.avaliado_id = u.id) AS cliente_nota,
                (SELECT COUNT(*) FROM avaliacoes av WHERE av.avaliado_id = u.id) AS cliente_total_avaliacoes,
                DATE_FORMAT(b.data_servico, '%d/%m/%Y') AS data_servico_formatada,
                DATE_FORMAT(b.data_servico, '%Y-%m-%d') AS data_servico_iso,
                c.status AS candidatura_status
            FROM candidaturas c
            JOIN bicos b ON c.bico_id = b.id
            JOIN usuarios u ON u.id = b.contratante_id
            WHERE c.trabalhador_id = ? AND c.status = 'Pendente'
            ORDER BY candidatura_ordem_ts DESC, c.id DESC
        `;

        // Nas consultas abaixo, o histórico usa apenas o registro mais recente do status
        // (subconsulta com LIMIT 1), evitando cards duplicados se houver vários registros.
        const queryCancelados = `
            SELECT
                c.id AS candidatura_id,
                UNIX_TIMESTAMP(COALESCE(h.data_alteracao, c.atualizado_em)) AS candidatura_ordem_ts,
                DATE_FORMAT(c.criado_em, '%d/%m/%Y %H:%i') AS candidatura_criada_formatada,
                DATE_FORMAT(c.atualizado_em, '%d/%m/%Y %H:%i') AS candidatura_atualizada_formatada,
                b.id AS bico_id,
                b.titulo,
                b.descricao,
                b.valor,
                b.status AS bico_status,
                b.horario,
                b.bairro AS local,
                u.nome AS cliente_nome,
                u.id AS cliente_id,
                (SELECT ROUND(AVG(av.nota), 1) FROM avaliacoes av WHERE av.avaliado_id = u.id) AS cliente_nota,
                (SELECT COUNT(*) FROM avaliacoes av WHERE av.avaliado_id = u.id) AS cliente_total_avaliacoes,
                DATE_FORMAT(b.data_servico, '%d/%m/%Y') AS data_servico_formatada,
                DATE_FORMAT(b.data_servico, '%Y-%m-%d') AS data_servico_iso,
                h.status_anterior,
                h.status_novo,
                DATE_FORMAT(h.data_alteracao, '%d/%m/%Y %H:%i') AS data_alteracao_formatada,
                h.observacao
            FROM candidaturas c
            JOIN bicos b ON c.bico_id = b.id
            JOIN usuarios u ON u.id = b.contratante_id
            LEFT JOIN historico_candidaturas h ON h.id = (
                SELECT h2.id FROM historico_candidaturas h2
                WHERE h2.candidatura_id = c.id AND h2.status_novo = 'Cancelado'
                ORDER BY h2.data_alteracao DESC, h2.id DESC LIMIT 1
            )
            WHERE c.trabalhador_id = ? AND c.status = 'Cancelado'
            ORDER BY candidatura_ordem_ts DESC, c.id DESC
        `;

        // Recusadas pelo contratante (inclui a recusa automática após aceitar outro candidato).
        // Mantém os mesmos campos do card de cancelados para reaproveitar a exibição.
        const queryRecusados = `
            SELECT
                c.id AS candidatura_id,
                UNIX_TIMESTAMP(COALESCE(h.data_alteracao, c.atualizado_em)) AS candidatura_ordem_ts,
                DATE_FORMAT(c.criado_em, '%d/%m/%Y %H:%i') AS candidatura_criada_formatada,
                DATE_FORMAT(c.atualizado_em, '%d/%m/%Y %H:%i') AS candidatura_atualizada_formatada,
                b.id AS bico_id,
                b.titulo,
                b.descricao,
                b.valor,
                b.status AS bico_status,
                b.horario,
                b.bairro AS local,
                u.nome AS cliente_nome,
                u.id AS cliente_id,
                (SELECT ROUND(AVG(av.nota), 1) FROM avaliacoes av WHERE av.avaliado_id = u.id) AS cliente_nota,
                (SELECT COUNT(*) FROM avaliacoes av WHERE av.avaliado_id = u.id) AS cliente_total_avaliacoes,
                DATE_FORMAT(b.data_servico, '%d/%m/%Y') AS data_servico_formatada,
                DATE_FORMAT(b.data_servico, '%Y-%m-%d') AS data_servico_iso,
                h.status_anterior,
                h.status_novo,
                DATE_FORMAT(h.data_alteracao, '%d/%m/%Y %H:%i') AS data_alteracao_formatada,
                h.observacao
            FROM candidaturas c
            JOIN bicos b ON c.bico_id = b.id
            JOIN usuarios u ON u.id = b.contratante_id
            LEFT JOIN historico_candidaturas h ON h.id = (
                SELECT h2.id FROM historico_candidaturas h2
                WHERE h2.candidatura_id = c.id AND h2.status_novo = 'Recusado'
                ORDER BY h2.data_alteracao DESC, h2.id DESC LIMIT 1
            )
            WHERE c.trabalhador_id = ? AND c.status = 'Recusado'
            ORDER BY candidatura_ordem_ts DESC, c.id DESC
        `;

        // Candidatura aceita cujo bico foi cancelado pelo contratante: nunca aparece como em andamento.
        // A data e o motivo vêm do evento 'Cancelamento' mais recente do bico.
        const queryCanceladosPeloContratante = `
            SELECT
                c.id AS candidatura_id,
                UNIX_TIMESTAMP(COALESCE(ec.data_evento, c.atualizado_em)) AS candidatura_ordem_ts,
                DATE_FORMAT(c.criado_em, '%d/%m/%Y %H:%i') AS candidatura_criada_formatada,
                DATE_FORMAT(c.atualizado_em, '%d/%m/%Y %H:%i') AS candidatura_atualizada_formatada,
                b.id AS bico_id,
                b.titulo,
                b.descricao,
                b.valor,
                b.status AS bico_status,
                b.horario,
                b.bairro AS local,
                u.nome AS cliente_nome,
                u.id AS cliente_id,
                (SELECT ROUND(AVG(av.nota), 1) FROM avaliacoes av WHERE av.avaliado_id = u.id) AS cliente_nota,
                (SELECT COUNT(*) FROM avaliacoes av WHERE av.avaliado_id = u.id) AS cliente_total_avaliacoes,
                DATE_FORMAT(b.data_servico, '%d/%m/%Y') AS data_servico_formatada,
                DATE_FORMAT(b.data_servico, '%Y-%m-%d') AS data_servico_iso,
                c.status AS status_anterior,
                'Cancelado' AS status_novo,
                DATE_FORMAT(ec.data_evento, '%d/%m/%Y %H:%i') AS data_alteracao_formatada,
                ec.observacao,
                1 AS cancelado_pelo_contratante
            FROM candidaturas c
            JOIN bicos b ON c.bico_id = b.id
            JOIN usuarios u ON u.id = b.contratante_id
            LEFT JOIN historico_eventos_bicos ec ON ec.id = (
                SELECT e2.id FROM historico_eventos_bicos e2
                WHERE e2.bico_id = b.id AND e2.tipo_evento = 'Cancelamento' AND e2.status_novo = 'Cancelado'
                ORDER BY e2.data_evento DESC, e2.id DESC LIMIT 1
            )
            WHERE c.trabalhador_id = ? AND c.status = 'Aceito' AND b.status = 'Cancelado'
            ORDER BY candidatura_ordem_ts DESC, c.id DESC
        `;

        const bicosAceitos = await pool.query(queryAceitos, [trabalhador_id]);
        const bicosConcluidos = (await pool.query(queryConcluidos, [trabalhador_id])).map((bico) => ({
            ...bico,
            selo_avaliacao: montarSeloAvaliacao(bico.minha_nota, bico.finalizado_em_raw, 'Avaliar contratante')
        }));
        const bicosPendentes = await pool.query(queryPendentes, [trabalhador_id]);
        const bicosRecusados = await pool.query(queryRecusados, [trabalhador_id]);
        const canceladosPeloTrabalhador = await pool.query(queryCancelados, [trabalhador_id]);
        const canceladosPeloContratante = await pool.query(queryCanceladosPeloContratante, [trabalhador_id]);
        const bicosCancelados = [...canceladosPeloContratante, ...canceladosPeloTrabalhador]
            .sort((a, b) => Number(b.candidatura_ordem_ts) - Number(a.candidatura_ordem_ts));

        return res.render('trabalhador/historicoTrabalhador', {
            aceitos: bicosAceitos,
            concluidos: bicosConcluidos,
            pendentes: bicosPendentes,
            recusados: bicosRecusados,
            cancelados: bicosCancelados,
            usuario: req.session.usuario
        });

    } catch (erro) {
        console.error('❌ Erro ao buscar histórico do trabalhador:', erro);
        return res.status(500).send('Erro ao carregar seu histórico.');
    }
};
