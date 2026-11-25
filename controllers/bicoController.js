import db from '../config/database.js';
import { definirAlerta } from '../middleware/sessaoMiddleware.js';
import { comRetentativa } from '../config/transacao.js';
import {
    sqlBicosConcluidosDoTrabalhador,
    sqlBicosConcluidosDoContratante,
    sqlCanceladosAposAceiteDoContratante
} from './reputacao.js';
import {
    PRAZO_AVALIACAO_DIAS,
    SQL_FINALIZADO_EM,
    sqlMediaAvaliacoes,
    sqlTotalAvaliacoes,
    calcularPrazoAvaliacao,
    montarSeloAvaliacao,
    normalizarComentario,
    carregarContextoAvaliacao
} from './avaliacaoRegras.js';
import {
    validarTituloBico,
    validarDescricaoBico,
    validarBairroBico,
    validarDataServico,
    dataServicoNoPassado,
    hojeEmSaoPaulo,
    validarHorarioServico,
    validarCep,
    normalizarCep,
    formatarCep,
    validarNumeroEndereco,
    normalizarNumeroEndereco,
    validarComplemento,
    validarLogradouro,
    LIMITE_MENSAGEM_CANDIDATURA,
    normalizarMensagemCandidatura,
    validarMensagemCandidatura
} from '../validations/bicoValidation.js';
import { buscarEnderecoPorCep, CepIndisponivelError } from '../services/cepService.js';

export { PRAZO_AVALIACAO_DIAS };

// Campos do formulário devolvidos à tela quando há erro, para o contratante não perder o que digitou.
const CAMPOS_FORMULARIO_BICO = [
    'titulo',
    'descricao',
    'valor',
    'data_servico',
    'horario',
    'cep',
    'numero',
    'complemento',
    'logradouro',
    'bairro'
];

const valoresDoFormularioBico = (corpo = {}) =>
    Object.fromEntries(
        CAMPOS_FORMULARIO_BICO.map((campo) => [campo, typeof corpo[campo] === 'string' ? corpo[campo] : ''])
    );

export const exibirFormularioPublicar = (req, res) => {
    if (!req.session?.usuario) {
        return res.redirect('/login');
    }

    return res.render('contratante/publicarBico', {
        usuario: req.session.usuario,
        erro: null,
        valores: valoresDoFormularioBico(),
        dataMinima: hojeEmSaoPaulo()
    });
};

export const MENSAGEM_CEP_INDISPONIVEL = 'Não conseguimos verificar o CEP agora, tente novamente em instantes.';

// Publicação do bico. O endereço é verificado pelo CEP: logradouro, bairro, cidade e UF são gravados
// a partir da consulta (buscarCep), nunca do req.body. Do formulário vêm só cep, numero e complemento —
// exceto no CEP geral de cidade pequena (consulta sem rua/bairro), em que rua e bairro digitados são aceitos.
export const criarCadastradorBico =
    (banco, buscarCep = buscarEnderecoPorCep, agora = () => new Date()) =>
    async (req, res) => {
        // Sem Content-Type reconhecido o Express 5 deixa req.body indefinido.
        const { titulo, descricao, valor, data_servico, horario, cep, numero, complemento } = req.body || {};
        const contratante_id = req.session?.usuario?.id;

        if (!contratante_id) {
            return res.redirect('/login');
        }

        const responderErro = (erro, status = 400) =>
            res.status(status).render('contratante/publicarBico', {
                usuario: req.session.usuario,
                erro,
                valores: valoresDoFormularioBico(req.body),
                dataMinima: hojeEmSaoPaulo(agora())
            });

        if (!validarTituloBico(titulo)) {
            return responderErro('O título deve ter entre 3 e 100 caracteres.');
        }

        if (!validarDescricaoBico(descricao)) {
            return responderErro('A descrição deve ter entre 10 e 500 caracteres.');
        }

        if (!validarCep(cep)) {
            return responderErro('Informe um CEP válido, com 8 dígitos.');
        }

        if (!validarNumeroEndereco(numero)) {
            return responderErro('Informe o número do endereço (até 10 caracteres) ou "S/N".');
        }

        if (!validarComplemento(complemento)) {
            return responderErro('O complemento deve ter no máximo 60 caracteres.');
        }

        if (!validarDataServico(data_servico)) {
            return responderErro('Informe a data do serviço.');
        }

        if (dataServicoNoPassado(data_servico, agora())) {
            return responderErro('A data do serviço não pode estar no passado.');
        }

        if (!validarHorarioServico(horario)) {
            return responderErro('Informe o horário do serviço.');
        }

        const valorNumerico = Number(valor);

        if (
            typeof valor !== 'string' ||
            !/^\d{1,8}(?:\.\d{1,2})?$/.test(valor) ||
            !Number.isFinite(valorNumerico) ||
            valorNumerico <= 0
        ) {
            return responderErro('Informe um valor maior que zero, com até duas casas decimais.');
        }

        // A consulta do CEP fica por último, para não chamar as APIs com o restante do formulário inválido.
        let endereco;
        try {
            endereco = await buscarCep(normalizarCep(cep));
        } catch (erro) {
            // As duas APIs fora (ou falha inesperada na consulta): o bico não é publicado.
            if (!(erro instanceof CepIndisponivelError)) {
                console.error('❌ Erro ao consultar o CEP do bico:', erro);
            }
            return responderErro(MENSAGEM_CEP_INDISPONIVEL, 503);
        }

        if (!endereco) {
            return responderErro('CEP não encontrado. Confira os números ou use o link "Não sei meu CEP".');
        }

        // CEP geral: a consulta não traz rua e/ou bairro, então esses campos vêm do formulário (validados).
        let { logradouro, bairro } = endereco;
        if (!logradouro) {
            if (!validarLogradouro(req.body.logradouro)) {
                return responderErro('Este CEP não informa a rua: digite a rua (entre 2 e 150 caracteres).');
            }
            logradouro = req.body.logradouro.trim();
        }
        if (!bairro) {
            if (!validarBairroBico(req.body.bairro)) {
                return responderErro('Este CEP não informa o bairro: digite o bairro (entre 2 e 100 caracteres).');
            }
            bairro = req.body.bairro.trim();
        }

        const complementoTexto = typeof complemento === 'string' ? complemento.trim() : '';

        try {
            const query = `
            INSERT INTO bicos (contratante_id, titulo, descricao, valor, bairro, cep, logradouro, numero, complemento,
                               cidade, uf, data_servico, horario, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Aberto')
        `;

            await banco.query(query, [
                contratante_id,
                titulo.trim(),
                descricao.trim(),
                valorNumerico,
                bairro,
                endereco.cep,
                logradouro,
                normalizarNumeroEndereco(numero),
                complementoTexto || null,
                endereco.cidade,
                endereco.uf,
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

export const cadastrarBico = criarCadastradorBico(db);

// Privacidade do endereço: rua, número, complemento e CEP só para o contratante dono do bico e para o
// trabalhador aceito (bicos.trabalhador_id). Os demais veem apenas bairro e cidade/UF — os campos
// privados são retirados do objeto antes de chegar à view, e não apenas escondidos no HTML.
export const prepararEnderecoParaExibicao = (bico, usuarioId) => {
    const ehParticipante =
        Number(bico.contratante_id) === usuarioId ||
        (bico.trabalhador_id !== null &&
            bico.trabalhador_id !== undefined &&
            Number(bico.trabalhador_id) === usuarioId);

    if (ehParticipante) {
        return { ...bico, podeVerEnderecoCompleto: true, cep_formatado: bico.cep ? formatarCep(bico.cep) : '' };
    }

    return {
        ...bico,
        podeVerEnderecoCompleto: false,
        cep: null,
        cep_formatado: '',
        logradouro: null,
        numero: null,
        complemento: null
    };
};

export const exibirDetalhesBico = async (req, res) => {
    const { id } = req.params;
    const usuarioLogado = req.session?.usuario;

    if (!usuarioLogado) {
        return res.redirect('/login');
    }

    try {
        // 1. Busca os detalhes do bico (b.* inclui o endereço: cep, logradouro, numero, complemento, cidade e uf;
        //    a parte privada é filtrada em prepararEnderecoParaExibicao)
        const queryBico = `
            SELECT b.*, u.nome AS contratante_nome,
                   ${sqlMediaAvaliacoes('u.id', 'contratante_media')},
                   ${sqlTotalAvaliacoes('u.id', 'contratante_total_avaliacoes')},
                   ${sqlBicosConcluidosDoContratante('u.id', 'contratante_bicos_concluidos')},
                   ${sqlCanceladosAposAceiteDoContratante('u.id', 'contratante_cancelados_apos_aceite')},
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

        // Trabalhador do bico finalizado: carrega a avaliação que ele já fez e o prazo para editá-la.
        const ehTrabalhadorDoBico =
            bicoEncontrado.status === 'Finalizado' && Number(bicoEncontrado.trabalhador_id) === Number(trabalhador_id);
        const avaliacao = ehTrabalhadorDoBico
            ? await carregarContextoAvaliacao(db, bicoEncontrado.id, Number(trabalhador_id))
            : null;

        return res.render('detalhesBico', {
            bico: prepararEnderecoParaExibicao(bicoEncontrado, Number(trabalhador_id)),
            minhaCandidatura: minhaCandidatura || null,
            usuario: usuarioLogado,
            avaliacao
        });
    } catch (erro) {
        console.error('❌ Erro ao buscar detalhes do bico:', erro);
        return res.status(500).send('Erro interno do servidor ao carregar o bico.');
    }
};

const ABAS_BICOS_CONTRATANTE = ['ativos', 'concluidos', 'cancelados'];

// Painel "Bicos" do contratante, com três abas (?aba=ativos|concluidos|cancelados):
// - ativos: Aberto e Em andamento;
// - concluidos: Finalizados, com data de finalização, trabalhador e selo de avaliação;
// - cancelados: Cancelados, com data, motivo e se houve estorno.
export const exibirBicosAtivosContratante = async (req, res) => {
    if (!req.session?.usuario) {
        return res.redirect('/login');
    }

    try {
        const usuarioId = req.session.usuario.id;
        const abaPedida = typeof req.query?.aba === 'string' ? req.query.aba : 'ativos';
        const aba = ABAS_BICOS_CONTRATANTE.includes(abaPedida) ? abaPedida : 'ativos';

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

        const concluidosBrutos = await db.query(
            `SELECT
                b.id,
                b.titulo,
                b.valor,
                b.bairro,
                DATE_FORMAT(b.data_servico, '%d/%m/%Y') AS data_servico_formatada,
                b.horario,
                u.nome AS nome_trabalhador,
                ${SQL_FINALIZADO_EM} AS finalizado_em,
                DATE_FORMAT(${SQL_FINALIZADO_EM}, '%d/%m/%Y') AS finalizado_em_formatada,
                (SELECT av.nota FROM avaliacoes av WHERE av.bico_id = b.id AND av.avaliador_id = b.contratante_id) AS minha_nota
             FROM bicos b
             LEFT JOIN usuarios u ON u.id = b.trabalhador_id
             WHERE b.contratante_id = ?
               AND b.status = 'Finalizado'
             ORDER BY finalizado_em DESC, b.id DESC`,
            [usuarioId]
        );
        const bicosConcluidos = concluidosBrutos.map((bico) => ({
            ...bico,
            selo_avaliacao: montarSeloAvaliacao(bico.minha_nota, bico.finalizado_em, 'Avaliar')
        }));

        const bicosCancelados = await db.query(
            `SELECT
                b.id,
                b.titulo,
                b.valor,
                b.bairro,
                DATE_FORMAT(b.data_servico, '%d/%m/%Y') AS data_servico_formatada,
                b.horario,
                (SELECT DATE_FORMAT(ev.data_evento, '%d/%m/%Y') FROM historico_eventos_bicos ev
                  WHERE ev.bico_id = b.id AND ev.status_novo = 'Cancelado'
                  ORDER BY ev.id DESC LIMIT 1) AS cancelado_em_formatada,
                (SELECT ev.observacao FROM historico_eventos_bicos ev
                  WHERE ev.bico_id = b.id AND ev.status_novo = 'Cancelado'
                  ORDER BY ev.id DESC LIMIT 1) AS motivo,
                (SELECT mv.valor FROM movimentacoes_carteira mv
                  WHERE mv.bico_id = b.id AND mv.tipo_movimentacao = 'ESTORNO' LIMIT 1) AS valor_estornado
             FROM bicos b
             WHERE b.contratante_id = ?
               AND b.status = 'Cancelado'
             ORDER BY b.id DESC`,
            [usuarioId]
        );

        res.render('contratante/bicosAtivos', {
            bicos: bicosAtivos,
            aba,
            concluidos: bicosConcluidos,
            cancelados: bicosCancelados
        });
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
    const { bico_id, mensagem } = req.body || {};

    // Trata a leitura do ID do trabalhador a partir da sessão
    const trabalhador_id = req.session?.usuario?.id || req.session?.usuario?.id_usuario;

    if (!trabalhador_id) {
        return res.redirect('/login');
    }

    const bicoIdNum = Number(bico_id);
    const trabalhadorIdNum = Number(trabalhador_id);

    if (
        !Number.isSafeInteger(bicoIdNum) ||
        bicoIdNum <= 0 ||
        !Number.isSafeInteger(trabalhadorIdNum) ||
        trabalhadorIdNum <= 0
    ) {
        return res.status(400).send('Identificador de bico ou trabalhador inválido.');
    }

    if (mensagem != null && typeof mensagem !== 'string') {
        return res.status(400).send('A mensagem da candidatura deve ser um texto.');
    }

    if (!validarMensagemCandidatura(mensagem)) {
        return res
            .status(400)
            .send(`A mensagem da candidatura deve ter no máximo ${LIMITE_MENSAGEM_CANDIDATURA} caracteres.`);
    }

    let connection;
    let transacaoAtiva = false;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        transacaoAtiva = true;

        const resBicos = await connection.query("SELECT id FROM bicos WHERE id = ? AND status = 'Aberto' FOR UPDATE", [
            bicoIdNum
        ]);

        const bico = obterPrimeiraLinha(resBicos);

        if (!bico) {
            await connection.rollback();
            transacaoAtiva = false;
            return res.status(400).send('Este bico não está disponível para candidaturas.');
        }

        const resInsert = await connection.query(
            "INSERT INTO candidaturas (bico_id, trabalhador_id, mensagem, status) VALUES (?, ?, ?, 'Pendente')",
            [bicoIdNum, trabalhadorIdNum, normalizarMensagemCandidatura(mensagem) || null]
        );

        const result = obterLinhas(resInsert);
        const candidaturaId = result.insertId;

        await connection.query(
            `INSERT INTO historico_candidaturas (candidatura_id, status_anterior, status_novo, alterado_por, observacao)
             VALUES (?, NULL, 'Pendente', ?, 'Trabalhador candidatou-se à vaga')`,
            [candidaturaId, trabalhadorIdNum]
        );

        await connection.commit();
        transacaoAtiva = false;
        return res.redirect('/hometrabalhador');
    } catch (erro) {
        if (connection && transacaoAtiva) {
            try {
                await connection.rollback();
            } catch (erroRollback) {
                console.error('Erro ao reverter candidatura:', erroRollback);
            }
        }
        console.error('❌ DETALHE DO ERRO AO CANDIDATAR:', erro);

        if (erro?.code === 'ER_DUP_ENTRY' || erro?.errno === 1062) {
            return res.status(400).send('Você já se candidatou a este bico!');
        }

        return res.status(500).send('Erro interno ao processar candidatura.');
    } finally {
        connection?.release();
    }
};

// 3. Contratante escolhe ou recusa um candidato (RF005 / US13)
const obterLinhas = (resultado) => (Array.isArray(resultado?.[0]) ? resultado[0] : resultado);

const obterPrimeiraLinha = (resultado) => {
    const linhas = obterLinhas(resultado);
    return Array.isArray(linhas) ? linhas[0] : linhas;
};

// Observação gravada no histórico das candidaturas recusadas automaticamente quando outra é aceita
// (também identifica esse caso nas notificações do trabalhador).
export const OBSERVACAO_RECUSA_AUTOMATICA = 'Recusada automaticamente após a aceitação de outra candidatura.';

// Factory para manter a operação testável com uma conexão isolada.

export const criarAtualizadorStatusCandidatura =
    (banco, opcoesRetentativa = {}) =>
    async (req, res) => {
        const { candidatura_id, novo_status, observacao } = req.body || {};
        const usuario_id = req.session?.usuario?.id || req.session?.usuario?.id_usuario;

        if (!usuario_id) {
            return res.redirect('/login');
        }

        const candidaturaIdNum =
            typeof candidatura_id === 'number'
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

        // Uma tentativa = a transação inteira (conexão, begin, passos, commit). Se o MariaDB escolher esta
        // requisição como vítima de deadlock (1213) ou lock wait timeout (1205), `comRetentativa` refaz tudo
        // do início (até 3 tentativas); o rollback e o release de cada tentativa acontecem aqui dentro.
        const tentar = async () => {
            let connection;
            let transacaoAtiva = false;

            // Depois que o bico é identificado e o contratante confirmado como dono, as recusas por regra
            // (400/409) voltam para a tela de gerenciamento com um alerta estilizado, em vez de texto puro.
            // Nada muda no banco: a transação é desfeita antes.
            let bicoIdDoAlerta = null;

            const responderComRollback = async (status, mensagem) => {
                await connection.rollback();
                transacaoAtiva = false;

                if (bicoIdDoAlerta && (status === 400 || status === 409)) {
                    const faltaSaldo = /^(Saldo insuficiente|Não foi possível reservar o valor)/.test(mensagem);
                    definirAlerta(req, {
                        tipo: 'erro',
                        mensagem,
                        acao: faltaSaldo ? { rotulo: 'Adicionar saldo', href: '/carteira/contratante' } : null
                    });
                    return res.redirect(`/bicos/${bicoIdDoAlerta}/gerenciar`);
                }

                return res.status(status).send(mensagem);
            };

            try {
                connection = await banco.getConnection();
                await connection.beginTransaction();
                transacaoAtiva = true;

                // 1. Localiza o bico relacionado à candidatura.
                const resultadoInicial = await connection.query('SELECT bico_id FROM candidaturas WHERE id = ?', [
                    candidaturaIdNum
                ]);

                const candidaturaInicial = obterPrimeiraLinha(resultadoInicial);

                if (!candidaturaInicial) {
                    return await responderComRollback(404, 'Candidatura não encontrada.');
                }

                const bicoId = candidaturaInicial.bico_id;

                // 2. Bloqueia o bico para evitar decisões simultâneas.
                const resultadoBico = await connection.query(
                    `SELECT id, contratante_id, status, valor
             FROM bicos
             WHERE id = ?
             FOR UPDATE`,
                    [bicoId]
                );

                const bico = obterPrimeiraLinha(resultadoBico);

                if (!bico) {
                    return await responderComRollback(404, 'Bico não encontrado.');
                }

                if (Number(bico.contratante_id) !== usuarioIdNum) {
                    return await responderComRollback(403, 'Você não tem autorização para alterar esta candidatura.');
                }

                bicoIdDoAlerta = bicoId;

                // 3. Bloqueia a candidatura.
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

                // 4. Se aceitar, verifica e reserva o saldo do contratante.
                if (novo_status === 'Aceito') {
                    const resultadoUsuario = await connection.query(
                        'SELECT saldo_simulado FROM usuarios WHERE id = ? FOR UPDATE',
                        [usuarioIdNum]
                    );

                    const contratante = obterPrimeiraLinha(resultadoUsuario);

                    if (!contratante) {
                        return await responderComRollback(404, 'Contratante não encontrado.');
                    }

                    const valorBico = Number(bico.valor);
                    const saldoDisponivel = Number(contratante.saldo_simulado);

                    if (!Number.isFinite(valorBico) || valorBico <= 0 || !Number.isFinite(saldoDisponivel)) {
                        return await responderComRollback(400, 'Não foi possível validar os valores da carteira.');
                    }

                    if (saldoDisponivel < valorBico) {
                        return await responderComRollback(
                            400,
                            'Saldo insuficiente. Adicione saldo à sua carteira para aceitar este trabalhador.'
                        );
                    }

                    // Desconta o valor da carteira.
                    const resultadoDebito = await connection.query(
                        `UPDATE usuarios
                 SET saldo_simulado = saldo_simulado - ?
                 WHERE id = ? AND saldo_simulado >= ?`,
                        [valorBico, usuarioIdNum, valorBico]
                    );

                    if (resultadoDebito.affectedRows !== 1) {
                        return await responderComRollback(
                            400,
                            'Não foi possível reservar o valor. Verifique seu saldo.'
                        );
                    }

                    // Registra a reserva no extrato.
                    await connection.query(
                        `INSERT INTO movimentacoes_carteira
                    (usuario_id, bico_id, tipo_movimentacao, valor, descricao)
                 VALUES (?, ?, 'RESERVA', ?, ?)`,
                        [usuarioIdNum, bicoId, valorBico, `Reserva do bico: ${bicoId}`]
                    );
                }

                // 5. Atualiza o status da candidatura.
                const resultadoAtualizacaoCandidatura = await connection.query(
                    `UPDATE candidaturas
             SET status = ?
             WHERE id = ? AND status = 'Pendente'`,
                    [novo_status, candidaturaIdNum]
                );

                if (resultadoAtualizacaoCandidatura.affectedRows !== 1) {
                    return await responderComRollback(
                        409,
                        'A candidatura foi alterada. Atualize a página e tente novamente.'
                    );
                }

                // 6. Registra o histórico da candidatura.
                await connection.query(
                    `INSERT INTO historico_candidaturas
                (candidatura_id, status_anterior, status_novo, alterado_por, observacao)
             VALUES (?, ?, ?, ?, ?)`,
                    [candidaturaIdNum, candidatura.status, novo_status, usuarioIdNum, observacao || null]
                );

                // 7. Se aceitou, vincula o trabalhador ao bico.
                if (novo_status === 'Aceito') {
                    await connection.query(
                        `UPDATE bicos
                 SET trabalhador_id = ?, status = 'Em andamento'
                 WHERE id = ? AND status = 'Aberto'`,
                        [candidatura.trabalhador_id, bicoId]
                    );

                    // Recusa automaticamente as outras candidaturas pendentes.
                    const resultadoPendentes = await connection.query(
                        `SELECT id
                 FROM candidaturas
                 WHERE bico_id = ?
                   AND id <> ?
                   AND status = 'Pendente'
                 ORDER BY id
                 FOR UPDATE`,
                        [bicoId, candidaturaIdNum]
                    );

                    const candidaturasPendentes = obterLinhas(resultadoPendentes) || [];

                    const observacaoAutomatica = OBSERVACAO_RECUSA_AUTOMATICA;

                    for (const pendente of candidaturasPendentes) {
                        await connection.query(
                            `UPDATE candidaturas
                     SET status = 'Recusado'
                     WHERE id = ? AND status = 'Pendente'`,
                            [pendente.id]
                        );

                        await connection.query(
                            `INSERT INTO historico_candidaturas
                        (candidatura_id, status_anterior, status_novo, alterado_por, observacao)
                     VALUES (?, 'Pendente', 'Recusado', ?, ?)`,
                            [pendente.id, usuarioIdNum, observacaoAutomatica]
                        );
                    }
                }

                // 8. Confirma todas as operações.
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

                throw erro;
            } finally {
                connection?.release();
            }
        };

        try {
            return await comRetentativa(tentar, opcoesRetentativa);
        } catch (erro) {
            // Qualquer erro que não seja de trava (ou 3 travas seguidas) segue para o 500, como antes.
            console.error('ERRO AO ATUALIZAR STATUS DA CANDIDATURA:', erro);

            return res.status(500).send('Erro interno ao atualizar candidatura.');
        }
    };

export const atualizarStatusCandidatura = criarAtualizadorStatusCandidatura(db);

export const finalizarBico = async (req, res) => {
    const bicoIdNum = typeof req.params?.id === 'string' && req.params.id.trim() !== '' ? Number(req.params.id) : NaN;

    const usuarioIdNum = Number(req.session?.usuario?.id || req.session?.usuario?.id_usuario);

    if (!Number.isInteger(bicoIdNum) || bicoIdNum <= 0) {
        return res.status(400).json({
            sucesso: false,
            erro: 'Identificador de bico inválido.'
        });
    }

    if (!Number.isInteger(usuarioIdNum) || usuarioIdNum <= 0) {
        return res.status(401).json({
            sucesso: false,
            erro: 'Autenticação necessária.'
        });
    }

    let connection;
    let transacaoAtiva = false;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();
        transacaoAtiva = true;

        // 1. Busca e bloqueia o bico.
        const resultadoBico = await connection.query(
            `SELECT id, contratante_id, trabalhador_id, valor, status
             FROM bicos
             WHERE id = ?
             FOR UPDATE`,
            [bicoIdNum]
        );

        const bico = obterPrimeiraLinha(resultadoBico);

        if (!bico) {
            await connection.rollback();
            transacaoAtiva = false;

            return res.status(404).json({
                sucesso: false,
                erro: 'Bico não encontrado.'
            });
        }

        // 2. Verifica se o contratante é o proprietário.
        if (Number(bico.contratante_id) !== usuarioIdNum) {
            await connection.rollback();
            transacaoAtiva = false;

            return res.status(403).json({
                sucesso: false,
                erro: 'Você não tem autorização para finalizar este bico.'
            });
        }

        // 3. Verifica se o bico está em andamento.
        if (bico.status !== 'Em andamento') {
            await connection.rollback();
            transacaoAtiva = false;

            return res.status(409).json({
                sucesso: false,
                erro: 'Somente bicos em andamento podem ser finalizados.'
            });
        }

        // 4. Valida os dados financeiros.
        if (!bico.trabalhador_id) {
            await connection.rollback();
            transacaoAtiva = false;

            return res.status(400).json({
                sucesso: false,
                erro: 'Este bico não possui um trabalhador vinculado.'
            });
        }

        const trabalhadorId = Number(bico.trabalhador_id);
        const valorBico = Number(bico.valor);

        if (!Number.isInteger(trabalhadorId) || trabalhadorId <= 0 || !Number.isFinite(valorBico) || valorBico <= 0) {
            await connection.rollback();
            transacaoAtiva = false;

            return res.status(400).json({
                sucesso: false,
                erro: 'Não foi possível validar os dados financeiros do bico.'
            });
        }

        // 5. Confirma que existe uma reserva válida para este bico.
        const resultadoReserva = await connection.query(
            `SELECT usuario_id, valor
             FROM movimentacoes_carteira
             WHERE bico_id = ?
               AND tipo_movimentacao = 'RESERVA'
             FOR UPDATE`,
            [bicoIdNum]
        );

        const reserva = obterPrimeiraLinha(resultadoReserva);

        if (!reserva) {
            await connection.rollback();
            transacaoAtiva = false;

            return res.status(400).json({
                sucesso: false,
                erro: 'Não existe uma reserva financeira para este bico.'
            });
        }

        const valorReservado = Number(reserva.valor);

        if (
            Number(reserva.usuario_id) !== usuarioIdNum ||
            !Number.isFinite(valorReservado) ||
            Math.round(valorReservado * 100) !== Math.round(valorBico * 100)
        ) {
            await connection.rollback();
            transacaoAtiva = false;

            return res.status(400).json({
                sucesso: false,
                erro: 'A reserva financeira não corresponde aos dados deste bico.'
            });
        }

        // 6. Verifica se já existe um crédito para este bico.
        const resultadoCreditoExistente = await connection.query(
            `SELECT id
             FROM movimentacoes_carteira
             WHERE bico_id = ?
               AND tipo_movimentacao = 'CREDITO'
             FOR UPDATE`,
            [bicoIdNum]
        );

        if (obterPrimeiraLinha(resultadoCreditoExistente)) {
            await connection.rollback();
            transacaoAtiva = false;

            return res.status(409).json({
                sucesso: false,
                erro: 'Este bico já possui um crédito registrado.'
            });
        }

        // 7. Bloqueia a carteira do trabalhador.
        const resultadoTrabalhador = await connection.query('SELECT id FROM usuarios WHERE id = ? FOR UPDATE', [
            trabalhadorId
        ]);

        if (!obterPrimeiraLinha(resultadoTrabalhador)) {
            await connection.rollback();
            transacaoAtiva = false;

            return res.status(404).json({
                sucesso: false,
                erro: 'Trabalhador não encontrado.'
            });
        }

        // 8. Atualiza o status do bico.
        const resultadoAtualizacao = await connection.query(
            `UPDATE bicos
             SET status = 'Finalizado'
             WHERE id = ?
               AND contratante_id = ?
               AND status = 'Em andamento'`,
            [bicoIdNum, usuarioIdNum]
        );

        if (resultadoAtualizacao.affectedRows !== 1) {
            await connection.rollback();
            transacaoAtiva = false;

            return res.status(409).json({
                sucesso: false,
                erro: 'O status do bico mudou. Atualize a página e tente novamente.'
            });
        }

        // 9. Credita o valor reservado ao trabalhador.
        const resultadoPagamento = await connection.query(
            `UPDATE usuarios
             SET saldo_simulado = saldo_simulado + ?
             WHERE id = ?`,
            [valorReservado, trabalhadorId]
        );

        if (resultadoPagamento.affectedRows !== 1) {
            throw new Error('Não foi possível atualizar o saldo do trabalhador.');
        }

        // 10. Registra o crédito na carteira.
        await connection.query(
            `INSERT INTO movimentacoes_carteira
                (usuario_id, bico_id, tipo_movimentacao, valor, descricao)
             VALUES (?, ?, 'CREDITO', ?, ?)`,
            [trabalhadorId, bicoIdNum, valorReservado, `Pagamento recebido pelo bico: ${bicoIdNum}`]
        );

        // 11. Registra o evento no histórico do bico.
        await connection.query(
            `INSERT INTO historico_eventos_bicos
                (bico_id, usuario_id, tipo_evento, status_anterior, status_novo)
             VALUES (?, ?, 'Finalizacao', ?, 'Finalizado')`,
            [bicoIdNum, usuarioIdNum, bico.status]
        );

        // 12. Confirma todas as operações.
        await connection.commit();
        transacaoAtiva = false;

        return res.json({
            sucesso: true,
            mensagem: 'Serviço finalizado e pagamento simulado realizado com sucesso.',
            status: 'Finalizado'
        });
    } catch (erro) {
        if (connection && transacaoAtiva) {
            try {
                await connection.rollback();
            } catch (erroRollback) {
                console.error('Erro ao reverter transação de finalização do bico:', erroRollback);
            }
        }

        console.error('ERRO AO FINALIZAR BICO:', erro);

        return res.status(500).json({
            sucesso: false,
            erro: 'Erro interno ao finalizar o bico.'
        });
    } finally {
        connection?.release();
    }
};

// Cancelamento de bico pelo contratante (POST /bicos/:id/cancelar).
// - Aberto: não há reserva; as candidaturas pendentes passam para Recusado.
// - Em andamento: a reserva volta ao saldo do contratante (movimentação ESTORNO).
// Tudo ocorre em uma única transação. Os valores financeiros são simulados.
export const OBSERVACAO_CANCELAMENTO_BICO = 'Bico cancelado pelo contratante';
const LIMITE_MOTIVO_CANCELAMENTO = 255;

export const criarCanceladorBico = (banco) => async (req, res) => {
    const bicoIdNum = typeof req.params?.id === 'string' && req.params.id.trim() !== '' ? Number(req.params.id) : NaN;

    const usuarioIdNum = Number(req.session?.usuario?.id || req.session?.usuario?.id_usuario);

    if (!Number.isInteger(bicoIdNum) || bicoIdNum <= 0) {
        return res.status(400).json({
            sucesso: false,
            erro: 'Identificador de bico inválido.'
        });
    }

    if (!Number.isInteger(usuarioIdNum) || usuarioIdNum <= 0) {
        return res.status(401).json({
            sucesso: false,
            erro: 'Autenticação necessária.'
        });
    }

    const motivoRecebido = req.body?.motivo;

    if (motivoRecebido !== undefined && motivoRecebido !== null && typeof motivoRecebido !== 'string') {
        return res.status(400).json({
            sucesso: false,
            erro: 'O motivo deve ser um texto.'
        });
    }

    const motivo = typeof motivoRecebido === 'string' ? motivoRecebido.trim() : '';

    if ([...motivo].length > LIMITE_MOTIVO_CANCELAMENTO) {
        return res.status(400).json({
            sucesso: false,
            erro: `O motivo deve ter no máximo ${LIMITE_MOTIVO_CANCELAMENTO} caracteres.`
        });
    }

    let connection;
    let transacaoAtiva = false;

    // Desfaz a transação e responde com o erro informado.
    const responderComRollback = async (status, erro) => {
        await connection.rollback();
        transacaoAtiva = false;

        return res.status(status).json({ sucesso: false, erro });
    };

    try {
        connection = await banco.getConnection();
        await connection.beginTransaction();
        transacaoAtiva = true;

        // 1. Busca e bloqueia o bico.
        const resultadoBico = await connection.query(
            `SELECT id, contratante_id, trabalhador_id, valor, status
             FROM bicos
             WHERE id = ?
             FOR UPDATE`,
            [bicoIdNum]
        );

        const bico = obterPrimeiraLinha(resultadoBico);

        if (!bico) {
            return await responderComRollback(404, 'Bico não encontrado.');
        }

        // 2. Somente o contratante dono do bico pode cancelar.
        if (Number(bico.contratante_id) !== usuarioIdNum) {
            return await responderComRollback(403, 'Você não tem autorização para cancelar este bico.');
        }

        // 3. Só bicos Abertos ou Em andamento podem ser cancelados.
        if (bico.status === 'Finalizado') {
            return await responderComRollback(409, 'Bicos finalizados não podem ser cancelados.');
        }

        if (bico.status === 'Cancelado') {
            return await responderComRollback(409, 'Este bico já foi cancelado.');
        }

        if (bico.status !== 'Aberto' && bico.status !== 'Em andamento') {
            return await responderComRollback(409, 'Este bico não pode ser cancelado no estado atual.');
        }

        // 4. Se já houve crédito ao trabalhador ou estorno, não há o que cancelar.
        const resultadoLiquidado = await connection.query(
            `SELECT id
             FROM movimentacoes_carteira
             WHERE bico_id = ?
               AND tipo_movimentacao IN ('CREDITO', 'ESTORNO')
             FOR UPDATE`,
            [bicoIdNum]
        );

        if (obterPrimeiraLinha(resultadoLiquidado)) {
            return await responderComRollback(409, 'Este bico já possui crédito ou estorno registrado.');
        }

        // 5. Localiza e bloqueia a reserva do bico (se existir).
        const resultadoReserva = await connection.query(
            `SELECT usuario_id, valor
             FROM movimentacoes_carteira
             WHERE bico_id = ?
               AND tipo_movimentacao = 'RESERVA'
             FOR UPDATE`,
            [bicoIdNum]
        );

        const reserva = obterPrimeiraLinha(resultadoReserva);
        const statusAnterior = bico.status;
        let valorEstornado = 0;

        if (statusAnterior === 'Aberto') {
            // Bico aberto não tem reserva. Se existir, os dados estão inconsistentes.
            if (reserva) {
                return await responderComRollback(
                    409,
                    'Este bico aberto possui uma reserva financeira. Verifique os dados antes de cancelar.'
                );
            }
        } else {
            const valorBico = Number(bico.valor);
            const valorReservado = Number(reserva?.valor);

            if (!reserva) {
                return await responderComRollback(400, 'Não existe uma reserva financeira para este bico.');
            }

            if (
                Number(reserva.usuario_id) !== usuarioIdNum ||
                !Number.isFinite(valorBico) ||
                !Number.isFinite(valorReservado) ||
                valorReservado <= 0 ||
                Math.round(valorReservado * 100) !== Math.round(valorBico * 100)
            ) {
                return await responderComRollback(400, 'A reserva financeira não corresponde aos dados deste bico.');
            }

            valorEstornado = valorReservado;

            // Bloqueia a carteira do contratante.
            const resultadoContratante = await connection.query('SELECT id FROM usuarios WHERE id = ? FOR UPDATE', [
                usuarioIdNum
            ]);

            if (!obterPrimeiraLinha(resultadoContratante)) {
                return await responderComRollback(404, 'Contratante não encontrado.');
            }
        }

        // 6. Atualiza o status do bico.
        const resultadoAtualizacao = await connection.query(
            `UPDATE bicos
             SET status = 'Cancelado'
             WHERE id = ?
               AND contratante_id = ?
               AND status = ?`,
            [bicoIdNum, usuarioIdNum, statusAnterior]
        );

        if (resultadoAtualizacao.affectedRows !== 1) {
            return await responderComRollback(409, 'O status do bico mudou. Atualize a página e tente novamente.');
        }

        // 7. Devolve a reserva ao contratante e registra o estorno.
        if (valorEstornado > 0) {
            const resultadoSaldo = await connection.query(
                `UPDATE usuarios
                 SET saldo_simulado = saldo_simulado + ?
                 WHERE id = ?`,
                [valorEstornado, usuarioIdNum]
            );

            if (resultadoSaldo.affectedRows !== 1) {
                throw new Error('Não foi possível atualizar o saldo do contratante.');
            }

            await connection.query(
                `INSERT INTO movimentacoes_carteira
                    (usuario_id, bico_id, tipo_movimentacao, valor, descricao)
                 VALUES (?, ?, 'ESTORNO', ?, ?)`,
                [usuarioIdNum, bicoIdNum, valorEstornado, `Estorno do bico: ${bicoIdNum}`]
            );
        }

        // 8. Recusa as candidaturas pendentes e registra o histórico de cada uma.
        const resultadoPendentes = await connection.query(
            `SELECT id
             FROM candidaturas
             WHERE bico_id = ?
               AND status = 'Pendente'
             ORDER BY id
             FOR UPDATE`,
            [bicoIdNum]
        );

        for (const pendente of obterLinhas(resultadoPendentes) || []) {
            await connection.query(
                `UPDATE candidaturas
                 SET status = 'Recusado'
                 WHERE id = ? AND status = 'Pendente'`,
                [pendente.id]
            );

            await connection.query(
                `INSERT INTO historico_candidaturas
                    (candidatura_id, status_anterior, status_novo, alterado_por, observacao)
                 VALUES (?, 'Pendente', 'Recusado', ?, ?)`,
                [pendente.id, usuarioIdNum, OBSERVACAO_CANCELAMENTO_BICO]
            );
        }

        // 9. A candidatura aceita continua "Aceito"; ganha apenas um registro no histórico.
        const resultadoAceitas = await connection.query(
            `SELECT id
             FROM candidaturas
             WHERE bico_id = ?
               AND status = 'Aceito'
             ORDER BY id
             FOR UPDATE`,
            [bicoIdNum]
        );

        for (const aceita of obterLinhas(resultadoAceitas) || []) {
            await connection.query(
                `INSERT INTO historico_candidaturas
                    (candidatura_id, status_anterior, status_novo, alterado_por, observacao)
                 VALUES (?, 'Aceito', 'Aceito', ?, ?)`,
                [aceita.id, usuarioIdNum, OBSERVACAO_CANCELAMENTO_BICO]
            );
        }

        // 10. Registra o evento no histórico do bico (motivo opcional).
        await connection.query(
            `INSERT INTO historico_eventos_bicos
                (bico_id, usuario_id, tipo_evento, status_anterior, status_novo, observacao)
             VALUES (?, ?, 'Cancelamento', ?, 'Cancelado', ?)`,
            [bicoIdNum, usuarioIdNum, statusAnterior, motivo || null]
        );

        // 11. Confirma todas as operações.
        await connection.commit();
        transacaoAtiva = false;

        return res.json({
            sucesso: true,
            mensagem:
                valorEstornado > 0
                    ? 'Bico cancelado. O valor reservado foi estornado ao seu saldo simulado.'
                    : 'Bico cancelado com sucesso.',
            status: 'Cancelado',
            valorEstornado
        });
    } catch (erro) {
        if (connection && transacaoAtiva) {
            try {
                await connection.rollback();
            } catch (erroRollback) {
                console.error('Erro ao reverter transação de cancelamento do bico:', erroRollback);
            }
        }

        console.error('ERRO AO CANCELAR BICO:', erro);

        return res.status(500).json({
            sucesso: false,
            erro: 'Erro interno ao cancelar o bico.'
        });
    } finally {
        connection?.release();
    }
};

export const cancelarBico = criarCanceladorBico(db);

// Avaliação bidirecional: o contratante do bico avalia o trabalhador e o trabalhador do bico avalia o
// contratante. Só bicos Finalizados, dentro de PRAZO_AVALIACAO_DIAS dias da finalização.
// A avaliação pode ser editada dentro do mesmo prazo.
export const criarSalvadorAvaliacaoBico =
    (banco, agora = () => new Date()) =>
    async (req, res) => {
        const bicoIdNum =
            typeof req.params?.id === 'string' && req.params.id.trim() !== '' ? Number(req.params.id) : NaN;
        const usuario = req.session?.usuario;
        const usuarioIdNum = Number(usuario?.id || usuario?.id_usuario);

        if (!Number.isInteger(bicoIdNum) || bicoIdNum <= 0) {
            return res.status(400).json({ sucesso: false, erro: 'Identificador de bico inválido.' });
        }

        if (!usuario || !Number.isInteger(usuarioIdNum) || usuarioIdNum <= 0) {
            return res.status(401).json({ sucesso: false, erro: 'Autenticação necessária.' });
        }

        const notaRecebida = req.body?.nota;
        const nota =
            typeof notaRecebida === 'number'
                ? notaRecebida
                : typeof notaRecebida === 'string' && /^[1-5]$/.test(notaRecebida)
                  ? Number(notaRecebida)
                  : NaN;

        if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
            return res.status(400).json({ sucesso: false, erro: 'A nota deve ser um número inteiro de 1 a 5.' });
        }

        const comentarioRecebido = req.body?.comentario;
        if (comentarioRecebido !== undefined && comentarioRecebido !== null && typeof comentarioRecebido !== 'string') {
            return res
                .status(400)
                .json({ sucesso: false, erro: 'O comentário deve ser um texto de até 500 caracteres.' });
        }

        const comentario = normalizarComentario(comentarioRecebido);
        if (comentario !== null && Array.from(comentario).length > 500) {
            return res.status(400).json({ sucesso: false, erro: 'O comentário deve ter no máximo 500 caracteres.' });
        }

        try {
            const resultadoBico = await banco.query(
                `SELECT b.contratante_id, b.trabalhador_id, b.status, ${SQL_FINALIZADO_EM} AS finalizado_em
             FROM bicos b
             WHERE b.id = ?`,
                [bicoIdNum]
            );
            const bico = obterPrimeiraLinha(resultadoBico);

            if (!bico) {
                return res.status(404).json({ sucesso: false, erro: 'Bico não encontrado.' });
            }

            // Só os dois participantes do bico avaliam; cada um avalia o outro.
            const ehContratante = Number(bico.contratante_id) === usuarioIdNum;
            const ehTrabalhador = Number(bico.trabalhador_id) === usuarioIdNum;

            if (!ehContratante && !ehTrabalhador) {
                return res
                    .status(403)
                    .json({ sucesso: false, erro: 'Você não tem autorização para avaliar este bico.' });
            }

            if (bico.status !== 'Finalizado') {
                return res.status(409).json({ sucesso: false, erro: 'Somente bicos finalizados podem ser avaliados.' });
            }

            const avaliadoId = ehContratante ? Number(bico.trabalhador_id) : Number(bico.contratante_id);
            if (!Number.isInteger(avaliadoId) || avaliadoId <= 0) {
                return res.status(409).json({ sucesso: false, erro: 'Este bico não possui um trabalhador associado.' });
            }

            // Depois do prazo não se cria nem se edita avaliação.
            if (calcularPrazoAvaliacao(bico.finalizado_em, agora()).encerrado) {
                return res.status(409).json({
                    sucesso: false,
                    erro: `O prazo de ${PRAZO_AVALIACAO_DIAS} dias para avaliar este bico terminou.`
                });
            }

            const existentes = await banco.query('SELECT id FROM avaliacoes WHERE bico_id = ? AND avaliador_id = ?', [
                bicoIdNum,
                usuarioIdNum
            ]);
            const existente = obterPrimeiraLinha(existentes);

            if (existente) {
                await banco.query('UPDATE avaliacoes SET nota = ?, comentario = ? WHERE id = ?', [
                    nota,
                    comentario,
                    existente.id
                ]);
                return res.json({ sucesso: true, acao: 'atualizada', mensagem: 'Avaliação atualizada.' });
            }

            await banco.query(
                `INSERT INTO avaliacoes (bico_id, avaliador_id, avaliado_id, nota, comentario)
             VALUES (?, ?, ?, ?, ?)`,
                [bicoIdNum, usuarioIdNum, avaliadoId, nota, comentario]
            );
            return res.json({ sucesso: true, acao: 'criada', mensagem: 'Avaliação registrada.' });
        } catch (erro) {
            if (erro?.code === 'ER_DUP_ENTRY' || erro?.errno === 1062) {
                return res.status(409).json({
                    sucesso: false,
                    erro: 'Não foi possível salvar a avaliação devido a um conflito. Tente novamente.'
                });
            }

            console.error('ERRO AO SALVAR AVALIAÇÃO DO BICO:', erro);
            return res.status(500).json({ sucesso: false, erro: 'Erro interno ao salvar a avaliação.' });
        }
    };

export const salvarAvaliacaoBico = criarSalvadorAvaliacaoBico(db);

// 4. Exibir o histórico apenas para o contratante do bico ou seu trabalhador.
export const criarExibidorHistoricoCandidatura = (banco) => async (req, res) => {
    const { candidatura_id } = req.params || {};
    const usuario = req.session?.usuario;

    if (!usuario) {
        return res.redirect('/login');
    }

    const candidaturaIdNum =
        typeof candidatura_id === 'number'
            ? candidatura_id
            : typeof candidatura_id === 'string' && candidatura_id.trim() !== ''
              ? Number(candidatura_id)
              : NaN;
    const usuarioIdNum = Number(usuario.id || usuario.id_usuario);
    const perfil = typeof usuario.tipo_perfil === 'string' ? usuario.tipo_perfil.trim().toLowerCase() : '';

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

    // Id que não é número não chega ao banco (NaN geraria erro de SQL e resposta 500).
    if (!/^\d+$/.test(String(id))) {
        return res.status(404).send('Bico não encontrado ou você não tem permissão para acessá-lo.');
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
                ${sqlMediaAvaliacoes('u.id', 'media_avaliacoes')},
                ${sqlTotalAvaliacoes('u.id', 'total_avaliacoes')},
                ${sqlBicosConcluidosDoTrabalhador('u.id', 'bicos_concluidos')}
            FROM candidaturas c
            JOIN usuarios u ON c.trabalhador_id = u.id
            WHERE c.bico_id = ?
            ORDER BY c.criado_em DESC
        `;

        const resCandidatos = await db.query(queryCandidatos, [bicoIdNum]);
        const candidatos = Array.isArray(resCandidatos?.[0]) ? resCandidatos[0] : resCandidatos;

        const avaliacao =
            bicoEncontrado.status === 'Finalizado' && Number(bicoEncontrado.trabalhador_id) > 0
                ? await carregarContextoAvaliacao(db, bicoIdNum, contratanteIdNum)
                : null;

        return res.render('contratante/gerenciarBico', {
            bico: bicoEncontrado,
            candidatos: Array.isArray(candidatos) ? candidatos : [],
            usuario: req.session.usuario,
            avaliacao
        });
    } catch (erro) {
        console.error('❌ Erro ao carregar gerenciamento do bico:', erro);
        return res.status(500).send('Erro interno do servidor.');
    }
};
// Cancelar a candidatura do bico

export const cancelarCandidatura = async (req, res) => {
    const { bico_id } = req.body ?? {};

    const trabalhadorId = req.session?.usuario?.id ?? req.session?.usuario?.id_usuario;

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

        const candidaturas = Array.isArray(resCand[0]) ? resCand[0] : resCand;

        const candidatura = candidaturas[0];

        if (!candidatura) {
            await connection.rollback();
            transacaoAtiva = false;

            return res.status(400).send('Candidatura não encontrada ou não pode mais ser cancelada.');
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

            return res.status(409).send('A candidatura mudou de estado. Atualize a página e tente novamente.');
        }

        // 5. Registra a alteração no histórico

        await connection.query(
            `INSERT INTO historico_candidaturas
                (candidatura_id, status_anterior, status_novo,
                 alterado_por, observacao)
             VALUES (?, 'Pendente', 'Cancelado', ?, ?)`,
            [candidatura.id, trabalhadorIdNum, 'Candidatura cancelada pelo próprio trabalhador']
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
                console.error('Erro ao reverter cancelamento da candidatura:', erroRollback);
            }
        }

        console.error('Erro ao cancelar candidatura:', erro);

        return res.status(500).send('Erro interno ao cancelar candidatura.');
    } finally {
        connection?.release();
    }
};
