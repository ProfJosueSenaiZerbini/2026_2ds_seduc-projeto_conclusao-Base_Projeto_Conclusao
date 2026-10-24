import pool from '../config/database.js';
import bcrypt from 'bcrypt';
import {
    normalizarCPF,
    validarConfirmacaoSenha,
    validarEmail,
    validarNome,
    validarSenha
} from '../validations/usuarioValidation.js';

export const criarCadastradorUsuario = (banco, hasher = bcrypt) => async (req, res) => {
    const body = req.body || {};
    const cpfsDeTeste = ['000.000.000-00', '999.999.999-99','888.888.888.88','777.777.777.77','666.666.666.66'];

    const mostrarErro = (mensagem, status = 400) => {
        return res.status(status).render('cadastrar', {
            erro: mensagem,
            dados: {
                nome,
                email,
                cpf: cpfInformado,
                tipoPerfil: tipoPerfilRecebido
            }
        });
    };


    const nome = typeof body.nome === 'string' ? body.nome.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const cpfInformado = typeof body.cpf === 'string' ? body.cpf.trim() : '';
    const cpfDeTeste = process.env.NODE_ENV === 'development'
        ? cpfsDeTeste.find((cpfReservado) => (
            cpfInformado === cpfReservado || cpfInformado === cpfReservado.replace(/\D/g, '')
        ))
        : null;
    const cpf = cpfDeTeste || normalizarCPF(cpfInformado);
    const tipoPerfilRecebido = typeof body.tipoPerfil === 'string' ? body.tipoPerfil.trim().toLowerCase() : '';
    const tipoPerfil = ['contratante', 'trabalhador'].includes(tipoPerfilRecebido) ? tipoPerfilRecebido : null;

    if (!nome || !email || !cpfInformado) {
        return mostrarErro('Preencha nome, e-mail e CPF.');
    }

    if (!validarEmail(email)) {
        return mostrarErro('Digite um e-mail válido.');
    }

    if (!cpf) {
        return mostrarErro('Digite um CPF válido.');
    }

    if (!validarNome(nome, 3)) {
        return mostrarErro('O nome deve ter entre 3 e 100 caracteres.');
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
            [nome, email, cpf, 18, senhaCriptografada, tipoPerfil]
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

        console.log(`✅ Login realizado! Usuário: ${usuario.nome} (ID: ${usuario.id}) | Perfil: ${usuario.tipo_perfil}`);

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

        return res.render('homeContratante', {
            usuario,
            bicos
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
        const queryAceitos = `
            SELECT 
                c.id AS candidatura_id,
                b.id AS bico_id,
                b.titulo,
                b.descricao,
                b.valor,
                b.status AS bico_status,
                DATE_FORMAT(b.data_servico, '%d/%m/%Y') AS data_servico_formatada,
                c.status AS candidatura_status
            FROM candidaturas c
            JOIN bicos b ON c.bico_id = b.id
            WHERE c.trabalhador_id = ? AND c.status = 'Aceito'
            ORDER BY b.data_servico DESC
        `;

        const queryPendentes = `
            SELECT 
                b.id AS bico_id,
                b.titulo,
                b.descricao,
                b.valor,
                b.status AS bico_status,
                DATE_FORMAT(b.data_servico, '%d/%m/%Y') AS data_servico_formatada,
                c.status AS candidatura_status
            FROM candidaturas c
            JOIN bicos b ON c.bico_id = b.id
            WHERE c.trabalhador_id = ? AND c.status = 'Pendente'
            ORDER BY c.criado_em DESC
        `;

        const queryCancelados = `
            SELECT
                c.id AS candidatura_id,
                b.id AS bico_id,
                b.titulo,
                b.descricao,
                b.valor,
                DATE_FORMAT(b.data_servico, '%d/%m/%Y') AS data_servico_formatada,
                c.status AS candidatura_status,
                h.status_anterior,
                h.status_novo,
                DATE_FORMAT(h.data_alteracao, '%d/%m/%Y %H:%i') AS data_alteracao_formatada,
                h.observacao
            FROM candidaturas c
            JOIN bicos b ON b.id = c.bico_id
            JOIN historico_candidaturas h ON h.candidatura_id = c.id
            WHERE c.trabalhador_id = ?
              AND c.status = 'Cancelado'
              AND h.status_novo = 'Cancelado'
            ORDER BY h.data_alteracao DESC
        `;

        // Alterado de "db.query" para "pool.query"
        const bicosAceitos = await pool.query(queryAceitos, [trabalhador_id]);
        const bicosPendentes = await pool.query(queryPendentes, [trabalhador_id]);
        const bicosCancelados = await pool.query(queryCancelados, [trabalhador_id]);

        return res.render('historicoTrabalhador', {
            aceitos: bicosAceitos,
            pendentes: bicosPendentes,
            cancelados: bicosCancelados,
            usuario: req.session.usuario
        });

    } catch (erro) {
        console.error('❌ Erro ao buscar histórico do trabalhador:', erro);
        return res.status(500).send('Erro ao carregar seu histórico.');
    }
};
