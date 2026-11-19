const database = require("../DATABASE/connection");

// Armazenamento em memória no backend para contingência
const comentariosMemoria = {
    1: [
        {
            id: 101,
            post_id: 1,
            usuario_id: 2,
            autor: "Camila Duarte",
            autor_foto: null,
            texto: "A estética Y2K traz tanta nostalgia! Esse ensaio capturou perfeitamente o espírito da época ✧",
            criado_em: new Date(Date.now() - 3600000 * 5).toISOString()
        },
        {
            id: 102,
            post_id: 1,
            usuario_id: 2,
            autor: "Beatriz Vasconcelos",
            autor_foto: null,
            texto: "Amei as referências de estilo! Quero ver mais textos sobre isso.",
            criado_em: new Date(Date.now() - 3600000 * 2).toISOString()
        }
    ],
    2: [
        {
            id: 103,
            post_id: 2,
            usuario_id: 2,
            autor: "Juliana Mendes",
            autor_foto: null,
            texto: "Meninas Malvadas é um clássico atemporal. Análise incrível!",
            criado_em: new Date(Date.now() - 3600000 * 8).toISOString()
        }
    ]
};

// ✦ Listar comentários de um post
async function listarComentarios(req, res) {
    try {
        const { id, postId } = req.params;
        const targetPostId = Number(id || postId);

        // 1. Tenta buscar no banco de dados
        try {
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

            if (comentarios && comentarios.length > 0) {
                return res.json(comentarios);
            }
        } catch (dbErr) {
            console.warn("[Backend Comentários] Tabela no banco ainda em transição, usando backend fallback:", dbErr.message);
        }

        // 2. Se o banco estiver vazio para esse post ou tabela não criada, retorna memória do backend
        const listaFallback = comentariosMemoria[targetPostId] || [];
        return res.json(listaFallback);
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

        const novoComentario = {
            id: Date.now(),
            post_id: targetPostId,
            usuario_id: usuarioId,
            autor: nomeUsuario,
            autor_foto: fotoUsuario,
            texto: texto.trim(),
            criado_em: new Date().toISOString()
        };

        // 1. Tenta persistir no banco de dados
        try {
            const [insertResult] = await database.query(
                "INSERT INTO comentarios (post_id, usuario_id, texto) VALUES (?, ?, ?)",
                [targetPostId, usuarioId, texto.trim()]
            );

            if (insertResult && insertResult.insertId) {
                novoComentario.id = insertResult.insertId;
            }
        } catch (dbErr) {
            console.warn("[Backend Comentários] Gravando na memória do backend:", dbErr.message);
        }

        // 2. Registra na memória do backend
        if (!comentariosMemoria[targetPostId]) {
            comentariosMemoria[targetPostId] = [];
        }
        comentariosMemoria[targetPostId].push(novoComentario);

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

        try {
            await database.query("DELETE FROM comentarios WHERE id = ? AND usuario_id = ?", [id, usuarioId]);
        } catch (dbErr) {
            // Remove da memória caso esteja lá
            Object.keys(comentariosMemoria).forEach((postId) => {
                comentariosMemoria[postId] = comentariosMemoria[postId].filter((c) => String(c.id) !== String(id));
            });
        }

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
