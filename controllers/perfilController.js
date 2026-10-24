import bcrypt from 'bcrypt';
import pool from '../config/database.js';
import { validarEmail, validarIdade, validarNome, validarSenha } from '../validations/usuarioValidation.js';

export const exibirPerfil = async (req, res) => {
    const sessao = req.session?.usuario;
    if (!sessao) return res.redirect('/login');
    try {
        const rows = await pool.query("SELECT id, nome, email, cpf, idade, tipo_perfil, DATE_FORMAT(criado_em, '%d/%m/%Y') AS data_cadastro_formatada FROM usuarios WHERE id = ?", [sessao.id || sessao.id_usuario]);
        const usuario = rows[0];
        if (!usuario) return res.redirect('/login');
        return res.render(usuario.tipo_perfil?.toLowerCase() === 'trabalhador' ? 'perfilTrabalhador' : 'perfilContratante', { usuario });
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
        return res.status(400).send('Preencha nome, e-mail e uma idade válida (18 anos ou mais).');
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

export const exibirPerfilPublicoTrabalhador = async (req, res) => {
    const idRecebido = req.params?.id;
    const trabalhadorId = typeof idRecebido === 'string' && /^\d+$/.test(idRecebido)
        ? Number(idRecebido)
        : NaN;

    if (!Number.isSafeInteger(trabalhadorId) || trabalhadorId <= 0 || trabalhadorId > 2147483647) {
        return res.status(400).send('Identificador de trabalhador inválido.');
    }

    try {
        const trabalhadores = await pool.query(
            `SELECT id, nome
             FROM usuarios
             WHERE id = ? AND LOWER(tipo_perfil) = 'trabalhador'
             LIMIT 1`,
            [trabalhadorId]
        );
        const trabalhador = trabalhadores[0];

        if (!trabalhador) {
            return res.status(404).send('Perfil de trabalhador não encontrado.');
        }

        const estatisticas = await pool.query(
            `SELECT COUNT(*) AS quantidade, AVG(a.nota) AS media
             FROM avaliacoes a
             JOIN usuarios contratante
               ON contratante.id = a.avaliador_id
              AND LOWER(contratante.tipo_perfil) = 'contratante'
             WHERE a.avaliado_id = ?`,
            [trabalhadorId]
        );
        const resumo = estatisticas[0] || {};

        const avaliacoes = await pool.query(
            `SELECT a.nota,
                    a.comentario,
                    contratante.nome AS contratante_nome,
                    DATE_FORMAT(a.data_atualizacao, '%d/%m/%Y') AS data_avaliacao
             FROM avaliacoes a
             JOIN usuarios contratante
               ON contratante.id = a.avaliador_id
              AND LOWER(contratante.tipo_perfil) = 'contratante'
             WHERE a.avaliado_id = ?
             ORDER BY a.data_atualizacao DESC, a.bico_id DESC`,
            [trabalhadorId]
        );

        return res.render('perfilPublicoTrabalhador', {
            trabalhador,
            mediaAvaliacoes: resumo.media === null ? 0 : Number(resumo.media),
            quantidadeAvaliacoes: Number(resumo.quantidade || 0),
            avaliacoes: avaliacoes.map((avaliacao) => ({
                ...avaliacao,
                nota: Number(avaliacao.nota)
            }))
        });
    } catch (erro) {
        console.error('Erro ao exibir perfil público do trabalhador:', erro?.code || 'erro inesperado');
        return res.status(500).send('Erro ao carregar o perfil público do trabalhador.');
    }
};
