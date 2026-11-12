const express = require("express");
const router = express.Router();
const database = require("../DATABASE/connection");
const authMiddleware = require("../middleware/authMiddleware");

// Obter perfil público do usuário
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const [usuarios] = await database.query(
            "SELECT id, nome, email, bio, headline, localizacao, foto, capa, status_tag, interesses, criado_em FROM usuario WHERE id = ?",
            [id]
        );

        if (!usuarios || usuarios.length === 0) {
            return res.status(404).json({ mensagem: "Usuário não encontrado." });
        }

        const user = usuarios[0];

        // Total de posts do usuário
        const [postsCount] = await database.query(
            "SELECT COUNT(*) AS total FROM posts WHERE usuario_id = ?",
            [id]
        );

        // Total de curtidas recebidas em todos os posts
        const [likesCount] = await database.query(
            "SELECT COUNT(*) AS total FROM curtidas c JOIN posts p ON c.post_id = p.id WHERE p.usuario_id = ?",
            [id]
        );

        return res.json({
            usuario: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                bio: user.bio,
                headline: user.headline,
                localizacao: user.localizacao,
                foto: user.foto,
                capa: user.capa,
                status_tag: user.status_tag,
                interesses: user.interesses,
                criado_em: user.criado_em,
                total_posts: postsCount[0]?.total || 0,
                total_likes: likesCount[0]?.total || 0
            }
        });
    } catch (err) {
        console.error("Erro ao buscar perfil de usuário:", err);
        return res.status(500).json({ mensagem: "Erro ao carregar dados do usuário." });
    }
});

// Atualizar perfil do usuário autenticado
router.put("/:id", authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const usuarioLogadoId = req.usuario?.id;

        if (String(usuarioLogadoId) !== String(id)) {
            return res.status(403).json({ mensagem: "Você só pode editar seu próprio perfil." });
        }

        const {
            nome,
            headline,
            bio,
            localizacao,
            foto,
            capa,
            status_tag,
            interesses
        } = req.body;

        await database.query(
            `UPDATE usuario SET 
                nome = COALESCE(?, nome),
                headline = COALESCE(?, headline),
                bio = COALESCE(?, bio),
                localizacao = COALESCE(?, localizacao),
                foto = COALESCE(?, foto),
                capa = COALESCE(?, capa),
                status_tag = COALESCE(?, status_tag),
                interesses = COALESCE(?, interesses)
             WHERE id = ?`,
            [
                nome !== undefined && nome !== null ? nome.trim() : null,
                headline !== undefined && headline !== null ? headline.trim() : null,
                bio !== undefined && bio !== null ? bio.trim() : null,
                localizacao !== undefined && localizacao !== null ? localizacao.trim() : null,
                foto !== undefined ? foto : null,
                capa !== undefined ? capa : null,
                status_tag !== undefined && status_tag !== null ? status_tag.trim() : null,
                interesses !== undefined && interesses !== null 
                    ? (typeof interesses === 'object' ? JSON.stringify(interesses) : interesses) 
                    : null,
                id
            ]
        );

        const [usuarios] = await database.query(
            "SELECT id, nome, email, bio, headline, localizacao, foto, capa, status_tag, interesses, criado_em FROM usuario WHERE id = ?",
            [id]
        );

        const user = usuarios[0];

        return res.json({
            mensagem: "Perfil atualizado com sucesso! ✧",
            usuario: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                bio: user.bio,
                headline: user.headline,
                localizacao: user.localizacao,
                foto: user.foto,
                capa: user.capa,
                status_tag: user.status_tag,
                interesses: user.interesses,
                criado_em: user.criado_em
            }
        });
    } catch (err) {
        console.error("Erro ao atualizar perfil:", err);
        return res.status(500).json({ mensagem: "Erro ao atualizar dados do perfil." });
    }
});

module.exports = router;
