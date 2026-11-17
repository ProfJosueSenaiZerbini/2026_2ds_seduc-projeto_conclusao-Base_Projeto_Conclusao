import bcrypt from 'bcrypt';
import pool from '../config/database.js';
import { validarEmail, validarIdade, validarNome, validarSenha } from '../validations/usuarioValidation.js';

export const exibirPerfil = async (req, res) => {
    const sessao = req.session?.usuario;
    if (!sessao) return res.redirect('/login');
    try {
        const rows = await pool.query("SELECT id, nome, email, cpf, idade, tipo_perfil, saldo_simulado, DATE_FORMAT(criado_em, '%d/%m/%Y') AS data_cadastro_formatada FROM usuarios WHERE id = ?", [sessao.id || sessao.id_usuario]);
        const usuario = rows[0];
        if (!usuario) return res.redirect('/login');
        const tipoPerfil = usuario.tipo_perfil?.trim().toLowerCase();
        if (tipoPerfil === 'trabalhador') {
            return res.render('trabalhador/perfilTrabalhador', { usuario });
        }
        if (tipoPerfil === 'contratante') {
            return res.render('contratante/perfilContratante', { usuario });
        }
        return res.status(403).send('Acesso negado para o perfil desta conta.');
    } catch (erro) {
        console.error('Erro ao exibir perfil:', erro?.code || 'erro inesperado');
        return res.status(500).send('Erro ao carregar os dados do perfil.');
    }
};

export const criarAtualizadorPerfil = (banco) => async (req, res) => {
    const id = req.session?.usuario?.id || req.session?.usuario?.id_usuario;
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) return res.redirect('/login');
    const body = req.body || {};
    const nome = typeof body.nome === 'string' ? body.nome.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!validarNome(nome) || !validarEmail(email) || !validarIdade(body.idade)) {
        return res.status(400).send('Preencha nome, e-mail e uma idade válida (entre 18 e 90 anos).');
    }
    const idade = Number(body.idade);
    try {
        const duplicados = await banco.query('SELECT id FROM usuarios WHERE email = ? AND id <> ? LIMIT 1', [email, Number(id)]);
        if (duplicados.length) return res.status(409).send('Este e-mail ja esta cadastrado.');
        await banco.query('UPDATE usuarios SET nome = ?, email = ?, idade = ? WHERE id = ?', [nome, email, idade, Number(id)]);
        Object.assign(req.session.usuario, { nome, email, idade });
        return res.redirect('/perfil');
    } catch (erro) {
        if (erro?.code === 'ER_DUP_ENTRY' || erro?.errno === 1062) return res.status(409).send('Este e-mail ja esta cadastrado.');
        console.error('Erro ao atualizar perfil:', erro?.code || 'erro inesperado');
        return res.status(500).send('Erro interno do servidor ao tentar salvar o perfil.');
    }
};
export const atualizarPerfil = criarAtualizadorPerfil(pool);

export const criarAtualizadorSenha = (banco, hasher = bcrypt) => async (req, res) => {
    const id = req.session?.usuario?.id || req.session?.usuario?.id_usuario;
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) return res.redirect('/login');
    const { senhaAtual, novaSenha, confirmarNovaSenha } = req.body || {};
    if (![senhaAtual, novaSenha, confirmarNovaSenha].every((v) => typeof v === 'string' && v.length)) return res.status(400).send('Por favor, preencha todos os campos de senha.');
    if (!validarSenha(novaSenha)) return res.status(400).send('A nova senha deve ter ao menos 6 caracteres e no máximo 72 bytes.');
    if (novaSenha !== confirmarNovaSenha) return res.status(400).send('A nova senha e a confirmacao nao conferem.');
    try {
        const rows = await banco.query('SELECT senha FROM usuarios WHERE id = ?', [Number(id)]);
        if (!rows[0]) return res.status(404).send('Usuario nao encontrado.');
        if (!await hasher.compare(senhaAtual, rows[0].senha)) return res.status(401).send('A senha atual esta incorreta.');
        const hash = await hasher.hash(novaSenha, 10);
        await banco.query('UPDATE usuarios SET senha = ? WHERE id = ?', [hash, Number(id)]);
        return res.redirect('/perfil');
    } catch (erro) {
        console.error('Erro ao alterar senha:', erro?.code || 'erro inesperado');
        return res.status(500).send('Erro interno ao tentar alterar a senha.');
    }
};
export const atualizarSenha = criarAtualizadorSenha(pool, bcrypt);

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

// Perfil público de trabalhador ou contratante. Expõe SOMENTE: nome, tipo de perfil, membro desde,
// média e quantidade de avaliações recebidas, bicos finalizados e a lista de avaliações recebidas.
// Nunca devolve e-mail, CPF, idade ou saldo (a consulta nem seleciona essas colunas).
export const exibirPerfilPublico = async (req, res) => {
    const idRecebido = req.params?.id;
    const usuarioId = typeof idRecebido === 'string' && /^\d+$/.test(idRecebido)
        ? Number(idRecebido)
        : NaN;

    if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0 || usuarioId > 2147483647) {
        return res.status(400).send('Identificador de usuário inválido.');
    }

    try {
        const usuarios = await pool.query(
            `SELECT id, nome, LOWER(tipo_perfil) AS tipo_perfil, criado_em
             FROM usuarios
             WHERE id = ? AND LOWER(tipo_perfil) IN ('trabalhador', 'contratante')
             LIMIT 1`,
            [usuarioId]
        );
        const perfil = usuarios[0];

        if (!perfil) {
            return res.status(404).send('Perfil não encontrado.');
        }

        const estatisticas = await pool.query(
            `SELECT COUNT(*) AS quantidade, AVG(nota) AS media
             FROM avaliacoes
             WHERE avaliado_id = ?`,
            [usuarioId]
        );
        const resumo = estatisticas[0] || {};

        const coluna = perfil.tipo_perfil === 'trabalhador' ? 'trabalhador_id' : 'contratante_id';
        const finalizados = await pool.query(
            `SELECT COUNT(*) AS total FROM bicos WHERE ${coluna} = ? AND status = 'Finalizado'`,
            [usuarioId]
        );

        const avaliacoes = await pool.query(
            `SELECT a.nota,
                    a.comentario,
                    avaliador.nome AS avaliador_nome,
                    DATE_FORMAT(a.data_atualizacao, '%d/%m/%Y') AS data_avaliacao
             FROM avaliacoes a
             JOIN usuarios avaliador ON avaliador.id = a.avaliador_id
             WHERE a.avaliado_id = ?
             ORDER BY a.data_atualizacao DESC, a.id DESC`,
            [usuarioId]
        );

        const desde = perfil.criado_em ? new Date(perfil.criado_em) : null;

        return res.render('perfilPublico', {
            perfil: {
                nome: perfil.nome,
                tipo: perfil.tipo_perfil,
                rotuloTipo: perfil.tipo_perfil === 'trabalhador' ? 'Trabalhador' : 'Contratante',
                membroDesde: desde && !Number.isNaN(desde.getTime())
                    ? `${MESES[desde.getMonth()]} de ${desde.getFullYear()}`
                    : null
            },
            mediaAvaliacoes: resumo.media === null || resumo.media === undefined ? 0 : Number(resumo.media),
            quantidadeAvaliacoes: Number(resumo.quantidade || 0),
            bicosFinalizados: Number(finalizados[0]?.total || 0),
            avaliacoes: avaliacoes.map((avaliacao) => ({
                ...avaliacao,
                nota: Number(avaliacao.nota)
            }))
        });
    } catch (erro) {
        console.error('Erro ao exibir perfil público:', erro?.code || 'erro inesperado');
        return res.status(500).send('Erro ao carregar o perfil público.');
    }
};
