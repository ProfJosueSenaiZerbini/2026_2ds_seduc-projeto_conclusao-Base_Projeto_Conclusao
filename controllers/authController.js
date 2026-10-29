import pool from '../config/database.js';
import bcrypt from 'bcrypt';

export const cadastrarUsuario = async (req, res) => {
    const { nome, email, cpf, maiorIdade, senha, confirmarSenha, tipoPerfil } = req.body;

    try {
        if (!nome || !email || !cpf || !senha || !confirmarSenha || !tipoPerfil) {
            return res.status(400).send('Todos os campos obrigatórios devem ser preenchidos.');
        }

        if (senha !== confirmarSenha) {
            return res.status(400).send('As senhas não coincidem!');
        }

        if (tipoPerfil.toLowerCase() === 'trabalhador' && !maiorIdade) {
            return res.status(403).send('Acesso Negado: Para trabalhar é preciso confirmar ter 18 anos ou mais!');
        }

        const usuarioExistente = await pool.query(
            'SELECT id FROM usuarios WHERE email = ? OR cpf = ?',
            [email, cpf]
        );

        if (usuarioExistente?.length > 0) {
            return res.status(409).send('E-mail ou CPF já cadastrado no sistema.');
        }

        const salt = await bcrypt.genSalt(10);
        const senhaCriptografada = await bcrypt.hash(senha, salt);
        const idadeFixa = 18;

        const queryInsert = `
            INSERT INTO usuarios (nome, email, cpf, idade, senha, tipo_perfil)
            VALUES (?, ?, ?, ?, ?, ?);
        `;

        await pool.query(queryInsert, [
            nome,
            email,
            cpf,
            idadeFixa,
            senhaCriptografada,
            tipoPerfil
        ]);

        console.log('✅ Usuário cadastrado no banco com sucesso!');
        return res.redirect('/login');
    } catch (erro) {
        console.error('❌ Erro no servidor durante cadastro:', erro);
        return res.status(500).send('Erro interno do servidor ao tentar cadastrar.');
    }
};

export const logarUsuario = async (req, res) => {
    const { email, senha, tipoPerfil } = req.body;

    try {
        const usuarios = await pool.query(
            'SELECT id, nome, senha, tipo_perfil FROM usuarios WHERE email = ?',
            [email]
        );

        if (usuarios.length === 0) {
            return res.status(401).send('E-mail não cadastrado!');
        }

        const usuario = usuarios[0];

        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
            return res.status(401).send('Senha incorreta!');
        }

        if (tipoPerfil && usuario.tipo_perfil.toLowerCase() !== tipoPerfil.toLowerCase()) {
            return res.status(403).send(`Sua conta está cadastrada como ${usuario.tipo_perfil}. Alterne a opção para continuar.`);
        }

        req.session.usuario = {
            id: usuario.id,
            nome: usuario.nome,
            tipo_perfil: usuario.tipo_perfil,
            saldo_simulado: usuario.saldo_simulado
        };

        console.log(`✅ Login realizado! Usuário: ${usuario.nome} | Perfil: ${usuario.tipo_perfil}`);

        if (usuario.tipo_perfil.toLowerCase() === 'trabalhador') {
            return res.redirect('/hometrabalhador');
        }

        return res.redirect('/homeContratante');
    } catch (error) {
        console.error('❌ Erro detalhado no login:', error);
        return res.status(500).send('Erro interno do servidor ao tentar logar.');
    }
};

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
        const busca = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';

        const ordenacoes = {
            recente: 'id DESC',
            menor_valor: 'CAST(valor AS DECIMAL(10, 2)) ASC, id DESC',
            maior_valor: 'CAST(valor AS DECIMAL(10, 2)) DESC, id DESC'
        };
        const ordenacao = Object.hasOwn(ordenacoes, req.query.ordenar)
            ? req.query.ordenar
            : 'recente';

        const bicos = await pool.query(
            `SELECT id, titulo, descricao, valor, bairro, status
             FROM bicos
             WHERE contratante_id = ?
               AND (titulo LIKE ? OR descricao LIKE ? OR bairro LIKE ?)
             ORDER BY ${ordenacoes[ordenacao]}`,
            [contratanteId, `%${busca}%`, `%${busca}%`, `%${busca}%`]
        );

        return res.render('homeContratante', {
            usuario,
            bicos,
            ordenacao,
            busca
        });
    } catch (erro) {
        console.error('Erro ao carregar dashboard do contratante:', erro);
        return res.status(500).send('Erro interno ao carregar a página.');
    }
};