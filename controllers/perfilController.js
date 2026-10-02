import bcrypt from 'bcrypt';

// 1. Renderiza a tela visualizada no PDF (Perfil do Contratante / Trabalhador)
import pool from '../config/database.js';

export const exibirPerfil = async (req, res) => {
    const usuarioSession = req.session?.usuario;

    if (!usuarioSession) {
        return res.redirect('/login');
    }

    const usuarioId = usuarioSession.id || usuarioSession.id_usuario;

    try {
        // Busca os dados atualizados do banco de dados
        const [usuarios] = await pool.query(
            "SELECT id, nome, email, cpf, idade, tipo_perfil, DATE_FORMAT(criado_em, '%d/%m/%Y') AS data_cadastro_formatada FROM usuarios WHERE id = ?",
            [usuarioId]
        );

        const usuario = Array.isArray(usuarios) ? usuarios[0] : usuarios;

        if (!usuario) {
            return res.redirect('/login');
        }

        // Seleciona a view de acordo com o perfil
        const viewDestino = usuario.tipo_perfil && usuario.tipo_perfil.toLowerCase() === 'trabalhador' 
            ? 'perfilTrabalhador' 
            : 'perfilContratante';

        return res.render(viewDestino, { usuario });

    } catch (erro) {
        console.error('❌ Erro ao exibir perfil:', erro);
        return res.status(500).send('Erro ao carregar os dados do perfil.');
    }
};

// Atualiza os dados do perfil e a sessao do usuario.
export const atualizarPerfil = async (req, res) => {
    // Pega o ID do usuário logado na sessão
    const usuarioId = req.session?.usuario?.id || req.session?.usuario?.id_usuario;

    if (!usuarioId) {
        return res.redirect('/login');
    }

    const { nome, email, idade } = req.body;
    const nomeNormalizado = typeof nome === 'string' ? nome.trim() : '';
    const emailNormalizado = typeof email === 'string' ? email.trim() : '';
    const idadeNumerica = Number(idade);

    if (!nomeNormalizado || !emailNormalizado || !Number.isInteger(idadeNumerica) || idadeNumerica < 18) {
        return res.status(400).send('Informe nome, e-mail e idade válida (18 anos ou mais).');
    }

    try {
        await pool.query(
            'UPDATE usuarios SET nome = ?, email = ?, idade = ? WHERE id = ?',
            [nomeNormalizado, emailNormalizado, idadeNumerica, usuarioId]
        );

        if (req.session.usuario) {
            req.session.usuario.nome = nomeNormalizado;
            req.session.usuario.email = emailNormalizado;
            req.session.usuario.idade = idadeNumerica;
        }

        console.log(`✅ Perfil atualizado com sucesso via modal para o usuário ID ${usuarioId}!`);

        return res.redirect('/perfil');

    } catch (erro) {
        console.error('❌ Erro ao atualizar o perfil:', erro);
        return res.status(500).send('Erro interno do servidor ao tentar salvar o perfil.');
    }
};

// Processa a alteracao de senha.
export const atualizarSenha = async (req, res) => {
    const usuarioId = req.session?.usuario?.id || req.session?.usuario?.id_usuario;
    if (!usuarioId) return res.redirect('/login');

    const { senhaAtual, novaSenha, confirmarNovaSenha } = req.body;

    // 1. Validações básicas de preenchimento
    if (!senhaAtual || !novaSenha || !confirmarNovaSenha) {
        return res.status(400).send('Por favor, preencha todos os campos de senha.');
    }

    if (novaSenha !== confirmarNovaSenha) {
        return res.status(400).send('A nova senha e a confirmação não conferem.');
    }

    try {
        // 2. Busca a senha atual criptografada no banco de dados
        const [usuarios] = await pool.query('SELECT senha FROM usuarios WHERE id = ?', [usuarioId]);
        const usuario = Array.isArray(usuarios) ? usuarios[0] : usuarios;

        if (!usuario) {
            return res.status(404).send('Usuário não encontrado.');
        }

        // 3. Compara a senha informada com a senha salva no banco
        const senhaCorreta = await bcrypt.compare(senhaAtual, usuario.senha);
        if (!senhaCorreta) {
            return res.status(401).send('A senha atual está incorreta.');
        }

        // 4. Criptografa a nova senha e atualiza no MySQL
        const novaSenhaHash = await bcrypt.hash(novaSenha, 10);
        await pool.query('UPDATE usuarios SET senha = ? WHERE id = ?', [novaSenhaHash, usuarioId]);

        console.log(`✅ Senha alterada com sucesso para o usuário ID ${usuarioId}!`);
        return res.redirect('/perfil');

    } catch (erro) {
        console.error('❌ Erro ao alterar senha:', erro);
        return res.status(500).send('Erro interno ao tentar alterar a senha.');
    }
};