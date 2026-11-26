const database = require("../DATABASE/connection");

// ✦ Listar comentários reais de um post
async function listarComentarios(req, res) {
    try {
        const { id, postId } = req.params;
        const targetPostId = Number(id || postId);

        const [comentarios] = await database.query(`
            SELECT
                c.id, 
                c.texto, 
                c.criado_em,
                u.id AS usuario_id, 
                u.nome AS autor, 
                u.foto AS autor_foto
            FROM comentarios c
            JOIN usuario u ON u.id = c.usuario_id
            WHERE c.post_id = ?
            ORDER BY c.criado_em ASC
        `, [targetPostId]);

        return res.json(comentarios || []);
    } catch (e) {
        console.error("Erro ao listar comentários no backend:", e);
        return res.status(500).json({ mensagem: "Erro ao carregar comentários." });
    }
}

// ✦ Adicionar novo comentário a um post
async function adicionarComentario(req, res) {
    try {
        const { id, postId } = req.params;
        const targetPostId = Number(id || postId);
        const usuarioId = req.usuario?.id || req.body.usuarioId || req.body.usuario_id;
        const nomeUsuario = req.usuario?.nome || req.body.autor || "Autora Lumina";
        const fotoUsuario = req.usuario?.foto || req.body.autor_foto || null;
        const { texto } = req.body;

        if (!usuarioId) {
            return res.status(401).json({ mensagem: "Você precisa estar logada para comentar." });
        }

        if (!texto || !texto.trim()) {
            return res.status(400).json({ mensagem: "O comentário não pode ser vazio." });
        }

        const [insertResult] = await database.query(
            "INSERT INTO comentarios (post_id, usuario_id, texto) VALUES (?, ?, ?)",
            [targetPostId, usuarioId, texto.trim()]
        );

        const novoComentario = {
            id: insertResult?.insertId || Date.now(),
            post_id: targetPostId,
            usuario_id: usuarioId,
            autor: nomeUsuario,
            autor_foto: fotoUsuario,
            texto: texto.trim(),
            criado_em: new Date().toISOString()
        };

        return res.status(201).json(novoComentario);
    } catch (e) {
        console.error("Erro ao adicionar comentário no backend:", e);
        return res.status(500).json({ mensagem: "Erro ao adicionar comentário." });
    }
}

// ✦ Excluir comentário
async function excluirComentario(req, res) {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario?.id;

        if (!usuarioId) {
            return res.status(401).json({ mensagem: "Não autorizado." });
        }

        await database.query("DELETE FROM comentarios WHERE id = ? AND usuario_id = ?", [id, usuarioId]);

        return res.json({ mensagem: "Comentário removido com sucesso." });
    } catch (e) {
        console.error("Erro ao excluir comentário:", e);
        return res.status(500).json({ mensagem: "Erro ao excluir comentário." });
    }
}

module.exports = {
    listarComentarios,
    adicionarComentario,
    excluirComentario
};
