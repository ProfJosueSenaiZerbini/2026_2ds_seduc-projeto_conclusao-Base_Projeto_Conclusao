const database = require("../DATABASE/connection");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function login(req, res) {

    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ mensagem: "Email e senha são obrigatorios" })
        }

        const [usuario] = await database.query(
            `
            SELECT id, nome, email, senha
            FROM usuario
            WHERE email = ?
            `,
            [email]
        );

        if (!usuario || usuario.length === 0) {
            return res.status(401).json({ mensagem: "Email ou senha invalidos." })
        }

        const user = usuario[0];

        const senhaCorreta = await bcrypt.compare(senha, user.senha)

        if (!senhaCorreta) {
            return res.status(401).json({ mensagem: "Email ou senha invalidos." })
        }

        const token = jwt.sign({
            id: user.id,
            email: user.email
        },
            process.env.JWT_SECRET,
            {
                expiresIn: "2h"
            })

        return res.json({
            mensagem: "login realizado com sucesso",
            token,
            usuario: {
                id: user.id,
                nome: user.nome,
                email: user.email
            }
        })
    } catch (e) {
        console.error(e);

        return res.status(500).json({ mensagem:"Erro interno do servidor"})

    }
}

async function register(req, res) {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ mensagem: "Nome, email e senha são obrigatórios." });
        }

        // Verifica se o e-mail já está cadastrado
        const [existente] = await database.query(
            "SELECT id FROM usuario WHERE email = ?",
            [email]
        );

        if (existente && existente.length > 0) {
            return res.status(409).json({ mensagem: "Este e-mail já está cadastrado." });
        }

        // Criptografa a senha
        const salt = await bcrypt.genSalt(10);
        const senhaCriptografada = await bcrypt.hash(password, salt);

        // Insere o novo usuário no banco
        const [resultado] = await database.query(
            "INSERT INTO usuario (nome, email, senha) VALUES (?, ?, ?)",
            [name, email, senhaCriptografada]
        );

        const novoUsuarioId = resultado.insertId;

        // Gera o token JWT automaticamente (login automático após cadastro)
        const token = jwt.sign(
            { id: novoUsuarioId, email: email },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        return res.status(201).json({
            mensagem: "Cadastro realizado com sucesso!",
            token,
            usuario: {
                id: novoUsuarioId,
                nome: name,
                email: email
            }
        });

    } catch (e) {
        console.error("Erro ao registrar usuário:", e);
        return res.status(500).json({ mensagem: "Erro interno do servidor." });
    }
}

module.exports = {
    login,
    register
};