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
    const emailLimpo = req.body.email ? req.body.email.trim() : '';
    const { senha, tipoPerfil } = req.body;

    try {
        // Executa a consulta
        const resultado = await pool.query(
            'SELECT id, nome, email, cpf, senha, tipo_perfil, saldo_simulado FROM usuarios WHERE email = ?',
            [emailLimpo]
        );

        // Trata o retorno do driver MySQL (seja array direto ou tupla [rows, fields])
        const usuarios = Array.isArray(resultado[0]) ? resultado[0] : resultado;

        // Se não houver nenhum registro retornado
        if (!usuarios || usuarios.length === 0) {
            return res.status(401).send('E-mail não cadastrado!');
        }

        // Pega o primeiro usuário encontrado
        const usuario = usuarios[0];

        // Garante que o usuário e a propriedade senha existam
        if (!usuario || !usuario.senha) {
            console.error('❌ Erro de estrutura do usuário retornado:', usuario);
            return res.status(500).send('Erro ao processar os dados do usuário.');
        }

        // Comparação da senha criptografada
        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
            return res.status(401).send('Senha incorreta!');
        }

        // Validação de tipo de perfil (se selecionado na tela de login)
        if (tipoPerfil && usuario.tipo_perfil.toLowerCase() !== tipoPerfil.toLowerCase()) {
            return res.status(403).send(`Sua conta está cadastrada como ${usuario.tipo_perfil}. Alterne a opção para continuar.`);
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