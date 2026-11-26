import bcrypt from 'bcrypt';
import pool from '../config/database.js';
import { validarEmail, validarIdade, validarNome, validarSenha } from '../validations/usuarioValidation.js';
import { buscarReputacao } from './reputacao.js';
import { renovarSessao, versaoDaSenha } from '../services/sessaoService.js';
import { detectarTipoImagem, urlDaFoto } from '../services/fotoPerfil.js';
import { definirAlerta } from '../middleware/sessaoMiddleware.js';

const MESES = [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro'
];
const formatarMembroDesde = (data) => {
    const d = data ? new Date(data) : null;
    return d && !Number.isNaN(d.getTime()) ? `${MESES[d.getMonth()]} de ${d.getFullYear()}` : null;
};

// "Membro recente": cadastro com menos de 30 dias.
const DIAS_MEMBRO_RECENTE = 30;
export const cadastroRecente = (criadoEm, agora = new Date()) => {
    const data = criadoEm ? new Date(criadoEm) : null;
    if (!data || Number.isNaN(data.getTime())) return false;
    return agora.getTime() - data.getTime() < DIAS_MEMBRO_RECENTE * 24 * 60 * 60 * 1000;
};

export const exibirPerfil = async (req, res) => {
    const sessao = req.session?.usuario;
    if (!sessao) return res.redirect('/login');
    try {
        const rows = await pool.query(
            `SELECT u.id, u.nome, u.email, u.cpf, u.idade, u.tipo_perfil, u.saldo_simulado, u.criado_em,
                    DATE_FORMAT(u.criado_em, '%d/%m/%Y') AS data_cadastro_formatada,
                    f.atualizado_em AS foto_atualizada_em
             FROM usuarios u
             LEFT JOIN fotos_perfil f ON f.usuario_id = u.id
             WHERE u.id = ?`,
            [sessao.id || sessao.id_usuario]
        );
        const usuario = rows[0];
        if (!usuario) return res.redirect('/login');
        const tipoPerfil = usuario.tipo_perfil?.trim().toLowerCase();
        if (tipoPerfil === 'trabalhador' || tipoPerfil === 'contratante') {
            const reputacao = await buscarReputacao(pool, usuario.id, tipoPerfil);
            const view =
                tipoPerfil === 'trabalhador' ? 'trabalhador/perfilTrabalhador' : 'contratante/perfilContratante';
            return res.render(view, {
                usuario,
                reputacao,
                membroDesde: formatarMembroDesde(usuario.criado_em),
                membroRecente: cadastroRecente(usuario.criado_em),
                fotoUrl: urlDaFoto(usuario.id, usuario.foto_atualizada_em)
            });
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
        const duplicados = await banco.query('SELECT id FROM usuarios WHERE email = ? AND id <> ? LIMIT 1', [
            email,
            Number(id)
        ]);
        if (duplicados.length) return res.status(409).send('Este e-mail ja esta cadastrado.');
        await banco.query('UPDATE usuarios SET nome = ?, email = ?, idade = ? WHERE id = ?', [
            nome,
            email,
            idade,
            Number(id)
        ]);
        Object.assign(req.session.usuario, { nome, email, idade });
        return res.redirect('/perfil');
    } catch (erro) {
        if (erro?.code === 'ER_DUP_ENTRY' || erro?.errno === 1062)
            return res.status(409).send('Este e-mail ja esta cadastrado.');
        console.error('Erro ao atualizar perfil:', erro?.code || 'erro inesperado');
        return res.status(500).send('Erro interno do servidor ao tentar salvar o perfil.');
    }
};
export const atualizarPerfil = criarAtualizadorPerfil(pool);

export const criarAtualizadorSenha =
    (banco, hasher = bcrypt) =>
    async (req, res) => {
        const id = req.session?.usuario?.id || req.session?.usuario?.id_usuario;
        if (!Number.isInteger(Number(id)) || Number(id) <= 0) return res.redirect('/login');
        const { senhaAtual, novaSenha, confirmarNovaSenha } = req.body || {};
        if (![senhaAtual, novaSenha, confirmarNovaSenha].every((v) => typeof v === 'string' && v.length))
            return res.status(400).send('Por favor, preencha todos os campos de senha.');
        if (!validarSenha(novaSenha))
            return res.status(400).send('A nova senha deve ter ao menos 6 caracteres e no máximo 72 bytes.');
        if (novaSenha !== confirmarNovaSenha) return res.status(400).send('A nova senha e a confirmacao nao conferem.');
        try {
            const rows = await banco.query('SELECT senha FROM usuarios WHERE id = ?', [Number(id)]);
            if (!rows[0]) return res.status(404).send('Usuario nao encontrado.');
            if (!(await hasher.compare(senhaAtual, rows[0].senha)))
                return res.status(401).send('A senha atual esta incorreta.');
            const hash = await hasher.hash(novaSenha, 10);
            await banco.query('UPDATE usuarios SET senha = ? WHERE id = ?', [hash, Number(id)]);

            // #162: a versão da senha muda, então as outras sessões desta conta caem na próxima requisição
            // (carregarDadosDaSessao). Esta sessão segue logada, com id novo e a versão nova.
            const usuarioLogado = req.session.usuario;
            await renovarSessao(req);
            req.session.usuario = usuarioLogado;
            req.session.versaoSenha = versaoDaSenha(hash);

            return res.redirect('/perfil');
        } catch (erro) {
            console.error('Erro ao alterar senha:', erro?.code || 'erro inesperado');
            return res.status(500).send('Erro interno ao tentar alterar a senha.');
        }
    };
export const atualizarSenha = criarAtualizadorSenha(pool, bcrypt);

// Foto de perfil (contratante e trabalhador). A imagem fica em fotos_perfil; quem não tem foto aparece com
// as iniciais. As recusas voltam para /perfil com o alerta da página (padrão "flash").
export const MENSAGENS_FOTO = Object.freeze({
    semArquivo: 'Escolha uma imagem para a foto de perfil.',
    tipoInvalido: 'A foto precisa ser uma imagem JPG, PNG ou WebP.',
    grandeDemais: 'A foto pode ter no máximo 2 MB.',
    erroInterno: 'Não foi possível salvar a foto agora. Tente novamente.'
});

const usuarioDaSessao = (req) => {
    const id = Number(req.session?.usuario?.id || req.session?.usuario?.id_usuario);
    return Number.isInteger(id) && id > 0 ? id : null;
};

export const recusarFoto = (req, res, mensagem) => {
    definirAlerta(req, { tipo: 'erro', mensagem });
    return res.redirect('/perfil');
};

// POST /perfil/foto (multipart, campo "foto"); o arquivo chega em req.file pelo multer (routes/perfilRoutes.js).
export const criarSalvadorFoto = (banco) => async (req, res) => {
    const usuarioId = usuarioDaSessao(req);
    if (!usuarioId) return res.redirect('/login');

    const dados = req.file?.buffer;
    if (!dados || dados.length === 0) return recusarFoto(req, res, MENSAGENS_FOTO.semArquivo);

    const tipo = detectarTipoImagem(dados);
    if (!tipo) return recusarFoto(req, res, MENSAGENS_FOTO.tipoInvalido);

    try {
        await banco.query(
            `INSERT INTO fotos_perfil (usuario_id, tipo, dados)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE tipo = VALUES(tipo), dados = VALUES(dados)`,
            [usuarioId, tipo, dados]
        );
        return res.redirect('/perfil');
    } catch (erro) {
        console.error('Erro ao salvar a foto de perfil:', erro?.code || 'erro inesperado');
        return recusarFoto(req, res, MENSAGENS_FOTO.erroInterno);
    }
};
export const salvarFoto = criarSalvadorFoto(pool);

// POST /perfil/foto/remover: apaga só a foto de quem está logado.
export const criarRemovedorFoto = (banco) => async (req, res) => {
    const usuarioId = usuarioDaSessao(req);
    if (!usuarioId) return res.redirect('/login');

    try {
        await banco.query('DELETE FROM fotos_perfil WHERE usuario_id = ?', [usuarioId]);
        return res.redirect('/perfil');
    } catch (erro) {
        console.error('Erro ao remover a foto de perfil:', erro?.code || 'erro inesperado');
        return recusarFoto(req, res, MENSAGENS_FOTO.erroInterno);
    }
};
export const removerFoto = criarRemovedorFoto(pool);

// GET /perfil/:id/foto: a imagem, para quem está logado (o perfil público também exige login).
// O tipo salvo veio da detecção dos bytes; nosniff impede o navegador de tratar o arquivo como outra coisa.
export const criarServidorFoto = (banco) => async (req, res) => {
    const idRecebido = req.params?.id;
    const usuarioId = typeof idRecebido === 'string' && /^\d+$/.test(idRecebido) ? Number(idRecebido) : NaN;

    if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0 || usuarioId > 2147483647) {
        return res.status(400).send('Identificador de usuário inválido.');
    }

    try {
        const linhas = await banco.query('SELECT tipo, dados FROM fotos_perfil WHERE usuario_id = ?', [usuarioId]);
        const foto = linhas[0];
        if (!foto) return res.status(404).send('Foto não encontrada.');

        res.set({
            'Content-Type': foto.tipo,
            'X-Content-Type-Options': 'nosniff',
            'Cache-Control': 'private, max-age=86400'
        });
        return res.send(foto.dados);
    } catch (erro) {
        console.error('Erro ao carregar a foto de perfil:', erro?.code || 'erro inesperado');
        return res.status(500).send('Erro ao carregar a foto.');
    }
};
export const servirFoto = criarServidorFoto(pool);

// Perfil público de trabalhador ou contratante. Expõe SOMENTE: nome, tipo de perfil, membro desde, último
// serviço concluído, indicadores de reputação (média, distribuição das notas, bicos) e as avaliações recebidas.
// Nunca devolve e-mail, CPF, idade ou saldo (as consultas nem selecionam essas colunas).
export const exibirPerfilPublico = async (req, res) => {
    const idRecebido = req.params?.id;
    const usuarioId = typeof idRecebido === 'string' && /^\d+$/.test(idRecebido) ? Number(idRecebido) : NaN;

    if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0 || usuarioId > 2147483647) {
        return res.status(400).send('Identificador de usuário inválido.');
    }

    try {
        const usuarios = await pool.query(
            `SELECT u.id, u.nome, LOWER(u.tipo_perfil) AS tipo_perfil, u.criado_em, f.atualizado_em AS foto_atualizada_em
             FROM usuarios u
             LEFT JOIN fotos_perfil f ON f.usuario_id = u.id
             WHERE u.id = ? AND LOWER(u.tipo_perfil) IN ('trabalhador', 'contratante')
             LIMIT 1`,
            [usuarioId]
        );
        const perfil = usuarios[0];

        if (!perfil) {
            return res.status(404).send('Perfil não encontrado.');
        }

        // Poucas consultas, sem N+1: notas agrupadas, contadores de bicos e a lista de avaliações.
        const reputacao = await buscarReputacao(pool, usuarioId, perfil.tipo_perfil);

        const avaliacoes = await pool.query(
            `SELECT a.nota,
                    a.comentario,
                    avaliador.nome AS avaliador_nome,
                    LOWER(avaliador.tipo_perfil) AS avaliador_tipo,
                    DATE_FORMAT(a.data_atualizacao, '%d/%m/%Y') AS data_avaliacao
             FROM avaliacoes a
             JOIN usuarios avaliador ON avaliador.id = a.avaliador_id
             WHERE a.avaliado_id = ?
             ORDER BY a.data_atualizacao DESC, a.id DESC
             LIMIT 200`,
            [usuarioId]
        );

        return res.render('perfilPublico', {
            perfil: {
                id: perfil.id,
                nome: perfil.nome,
                tipo: perfil.tipo_perfil,
                rotuloTipo: perfil.tipo_perfil === 'trabalhador' ? 'Trabalhador' : 'Contratante',
                membroDesde: formatarMembroDesde(perfil.criado_em)
            },
            fotoUrl: urlDaFoto(perfil.id, perfil.foto_atualizada_em),
            reputacao,
            avaliacoes: avaliacoes.map((avaliacao) => ({
                ...avaliacao,
                nota: Number(avaliacao.nota),
                avaliador_rotulo: avaliacao.avaliador_tipo === 'trabalhador' ? 'Trabalhador' : 'Contratante'
            }))
        });
    } catch (erro) {
        console.error('Erro ao exibir perfil público:', erro?.code || 'erro inesperado');
        return res.status(500).send('Erro ao carregar o perfil público.');
    }
};
