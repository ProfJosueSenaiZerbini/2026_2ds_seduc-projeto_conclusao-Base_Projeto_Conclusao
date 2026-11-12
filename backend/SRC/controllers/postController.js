const database = require("../DATABASE/connection");

async function listarPublicos(req, res) {
    try {
        const [posts] = await database.query(
            `
            SELECT
                p.id, 
                p.titulo, 
                p.resumo, 
                p.imagem, 
                p.categoria, 
                p.criando_em, 
                p.publicado,
                u.nome AS autor,
                (SELECT COUNT(*) FROM curtidas WHERE post_id = p.id) AS likes,
                (SELECT COUNT(*) FROM comentarios WHERE post_id = p.id) AS total_comentarios
            FROM posts p
            LEFT JOIN usuario u ON u.id = p.usuario_id
            WHERE p.publicado = 1 OR p.publicado = 0 
            ORDER BY p.criando_em DESC
            `
        );

        return res.json(posts);
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            mensagem: "Erro ao carregar posts."
        });
    }
}

async function buscarPublicos(req, res) {
    try {
        const { id } = req.params;

        const [posts] = await database.query(`
            SELECT
                p.id, 
                p.titulo, 
                p.conteudo, 
                p.resumo, 
                p.imagem, 
                p.categoria, 
                p.criando_em, 
                p.publicado, 
                u.nome AS autor,
                (SELECT COUNT(*) FROM curtidas WHERE post_id = p.id) AS likes,
                (SELECT COUNT(*) FROM comentarios WHERE post_id = p.id) AS total_comentarios
            FROM posts p 
            LEFT JOIN usuario u ON u.id = p.usuario_id
            WHERE p.id = ?`, [id]);

        if (posts.length === 0) {
            return res.status(404).json({
                mensagem: "Post não encontrado"
            });
        }

        return res.json(posts[0]);
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            mensagem: "Erro ao buscar post"
        });
    }
}

async function criar(req, res) {
    try {
        const {
            titulo, resumo, conteudo, imagem, publicado, categoria
        } = req.body;

        if (!titulo || !conteudo) {
            return res.status(400).json({ mensagem: "Título e conteúdo são obrigatórios." });
        }

        // Obtém o ID do autor estritamente do token autenticado
        const autorId = req.usuario?.id;

        if (!autorId) {
            return res.status(401).json({ mensagem: "Usuário não autenticado." });
        }

        const statusPublicado = publicado !== undefined ? (publicado ? 1 : 0) : 1;
        const resumoFinal = resumo || (conteudo ? (conteudo.length > 150 ? conteudo.substring(0, 150) + '...' : conteudo) : null);
        const imagemFinal = imagem && typeof imagem === 'string' && imagem.trim() ? imagem.trim() : null;
        const categoriaFinal = categoria && typeof categoria === 'string' && categoria.trim() ? categoria.trim() : 'MODA & ESTILO';

        const [resultado] = await database.query(`
            INSERT INTO posts(
                titulo, resumo, conteudo, imagem, categoria, publicado, usuario_id)
            VALUES(?, ?, ?, ?, ?, ?, ?)`,
            [titulo, resumoFinal, conteudo, imagemFinal, categoriaFinal, statusPublicado, autorId]
        );

        return res.status(201).json({
            mensagem: "Post criado com sucesso! ✧",
            id: resultado.insertId
        });

    } catch (e) {
        console.error(e);
        return res.status(500).json({
            mensagem: "Erro ao criar post"
        });
    }
}

// ✦ REDE SOCIAL: Alternar curtida (Like / Deslike)
async function alternarCurtida(req, res) {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario?.id;

        if (!usuarioId) {
            return res.status(401).json({ mensagem: "Você precisa estar logada para curtir." });
        }

        const [existe] = await database.query(
            "SELECT id FROM curtidas WHERE usuario_id = ? AND post_id = ?",
            [usuarioId, id]
        );

        let curtido = false;
        if (existe.length > 0) {
            await database.query(
                "DELETE FROM curtidas WHERE usuario_id = ? AND post_id = ?",
                [usuarioId, id]
            );
            curtido = false;
        } else {
            await database.query(
                "INSERT INTO curtidas (usuario_id, post_id) VALUES (?, ?)",
                [usuarioId, id]
            );
            curtido = true;
        }

        const [totais] = await database.query(
            "SELECT COUNT(*) AS total FROM curtidas WHERE post_id = ?",
            [id]
        );

        return res.json({
            curtido,
            likes: totais[0]?.total || 0
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ mensagem: "Erro ao processar curtida." });
    }
}

// ✦ REDE SOCIAL: Obter status da curtida
async function statusCurtida(req, res) {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario?.id;

        const [totais] = await database.query(
            "SELECT COUNT(*) AS total FROM curtidas WHERE post_id = ?",
            [id]
        );

        let curtido = false;
        if (usuarioId) {
            const [existe] = await database.query(
                "SELECT id FROM curtidas WHERE usuario_id = ? AND post_id = ?",
                [usuarioId, id]
            );
            curtido = existe.length > 0;
        }

        return res.json({
            curtido,
            likes: totais[0]?.total || 0
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ mensagem: "Erro ao obter status da curtida." });
    }
}

// ✦ REDE SOCIAL: Listar comentários de um post
async function listarComentarios(req, res) {
    try {
        const { id } = req.params;

        const [comentarios] = await database.query(`
            SELECT
                c.id, 
                c.texto, 
                c.criado_em,
                u.id AS usuario_id, 
                u.nome AS autor
            FROM comentarios c
            JOIN usuario u ON u.id = c.usuario_id
            WHERE c.post_id = ?
            ORDER BY c.criado_em ASC
        `, [id]);

        return res.json(comentarios);
    } catch (e) {
        console.error(e);
        return res.status(500).json({ mensagem: "Erro ao carregar comentários." });
    }
}

// ✦ REDE SOCIAL: Adicionar novo comentário
async function adicionarComentario(req, res) {
    try {
        const { id } = req.params;
        const usuarioId = req.usuario?.id;
        const { texto } = req.body;

        if (!usuarioId) {
            return res.status(401).json({ mensagem: "Você precisa estar logada para comentar." });
        }

        if (!texto || !texto.trim()) {
            return res.status(400).json({ mensagem: "O comentário não pode ser vazio." });
        }

        const [result] = await database.query(
            "INSERT INTO comentarios (post_id, usuario_id, texto) VALUES (?, ?, ?)",
            [id, usuarioId, texto.trim()]
        );

        const [novo] = await database.query(`
            SELECT
                c.id, 
                c.texto, 
                c.criado_em,
                u.id AS usuario_id, 
                u.nome AS autor
            FROM comentarios c
            JOIN usuario u ON u.id = c.usuario_id
            WHERE c.id = ?
        `, [result.insertId]);

        return res.status(201).json(novo[0]);
    } catch (e) {
        console.error(e);
        return res.status(500).json({ mensagem: "Erro ao adicionar comentário." });
    }
}

module.exports = {
    listarPublicos,
    buscarPublicos,
    criar,
    alternarCurtida,
    statusCurtida,
    listarComentarios,
    adicionarComentario
};
