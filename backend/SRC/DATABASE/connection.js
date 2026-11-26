require("dotenv").config();

const useSupabase = Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY));

let database;

if (useSupabase) {
    const { createClient } = require("@supabase/supabase-js");

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

    const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    });

    console.log("✧ Conectado ao Supabase Online:", supabaseUrl);

    database = {
        supabase,
        async end() {
            return Promise.resolve();
        },
        async query(sql, params = []) {
            const cleanSql = sql.replace(/\s+/g, " ").trim();
            const upperSql = cleanSql.toUpperCase();

            // 1. Ignorar CREATE TABLE automáticos (o schema é mantido no Supabase)
            if (upperSql.startsWith("CREATE TABLE")) {
                return [[], []];
            }

            // 2. Tabela USUARIO - INSERT
            if (upperSql.includes("INSERT INTO USUARIO") || upperSql.includes("INSERT INTO USUARIOS")) {
                const [nome, email, senha] = params;
                const { data, error } = await supabase
                    .from("usuario")
                    .insert({ nome, email, senha })
                    .select("id");

                if (error) {
                    if (error.code === "23505" || error.message?.includes("duplicate") || error.message?.includes("unique")) {
                        const dupErr = new Error("Administrador já cadastrado.");
                        dupErr.code = "ER_DUP_ENTRY";
                        throw dupErr;
                    }
                    throw error;
                }

                return [{ insertId: data[0]?.id }, []];
            }

            // 3. Tabela USUARIO - SELECT por EMAIL
            if (upperSql.includes("FROM USUARIO") && upperSql.includes("EMAIL = ?")) {
                const [email] = params;
                const { data, error } = await supabase
                    .from("usuario")
                    .select("id, nome, email, senha")
                    .eq("email", email);

                if (error) throw error;
                return [data || [], []];
            }

            // 4. Tabela USUARIO - SELECT por ID
            if (upperSql.includes("FROM USUARIO") && upperSql.includes("ID = ?") && !upperSql.includes("UPDATE")) {
                const [id] = params;
                const { data, error } = await supabase
                    .from("usuario")
                    .select("id, nome, email, bio, headline, localizacao, foto, capa, status_tag, interesses, criado_em")
                    .eq("id", id);

                if (error) throw error;
                return [data || [], []];
            }

            // 5. Tabela USUARIO - SELECT geral
            if (upperSql.includes("FROM USUARIO") && !upperSql.includes("WHERE") && !upperSql.includes("UPDATE")) {
                const { data, error } = await supabase
                    .from("usuario")
                    .select("id, nome, email, foto, headline")
                    .order("id", { ascending: true });

                if (error) throw error;
                return [data || [], []];
            }

            // 6. Tabela USUARIO - UPDATE
            if (upperSql.startsWith("UPDATE USUARIO")) {
                const id = params[params.length - 1];
                const updateData = {};
                if (params[0] !== undefined && params[0] !== null) updateData.nome = params[0];
                if (params[1] !== undefined && params[1] !== null) updateData.headline = params[1];
                if (params[2] !== undefined && params[2] !== null) updateData.bio = params[2];
                if (params[3] !== undefined && params[3] !== null) updateData.localizacao = params[3];
                if (params[4] !== undefined && params[4] !== null) updateData.foto = params[4];
                if (params[5] !== undefined && params[5] !== null) updateData.capa = params[5];
                if (params[6] !== undefined && params[6] !== null) updateData.status_tag = params[6];
                if (params[7] !== undefined && params[7] !== null) updateData.interesses = params[7];

                const { error } = await supabase
                    .from("usuario")
                    .update(updateData)
                    .eq("id", id);

                if (error) throw error;
                return [{ affectedRows: 1 }, []];
            }

            // 7. Tabela POSTS - COUNT por usuario_id
            if (upperSql.includes("COUNT(*)") && upperSql.includes("FROM POSTS") && upperSql.includes("USUARIO_ID = ?")) {
                const [userId] = params;
                const { count, error } = await supabase
                    .from("posts")
                    .select("*", { count: "exact", head: true })
                    .eq("usuario_id", userId);

                if (error) throw error;
                return [[{ total: count || 0 }], []];
            }

            // 8. Tabela CURTIDAS - COUNT por usuario_id (total de likes em posts da usuária)
            if (upperSql.includes("FROM CURTIDAS") && upperSql.includes("P.USUARIO_ID = ?")) {
                const [userId] = params;
                try {
                    const { data: userPosts } = await supabase
                        .from("posts")
                        .select("id")
                        .eq("usuario_id", userId);

                    const postIds = (userPosts || []).map((p) => p.id);
                    let total = 0;
                    if (postIds.length > 0) {
                        const { count } = await supabase
                            .from("curtidas")
                            .select("*", { count: "exact", head: true })
                            .in("post_id", postIds);
                        total = count || 0;
                    }
                    return [[{ total }], []];
                } catch {
                    return [[{ total: 0 }], []];
                }
            }

            // 9. Tabela POSTS - INSERT
            if (upperSql.includes("INSERT INTO POSTS")) {
                const [titulo, resumo, conteudo, imagem, categoria, publicado, usuario_id] = params;
                let { data, error } = await supabase
                    .from("posts")
                    .insert({
                        titulo,
                        resumo,
                        conteudo,
                        imagem,
                        categoria: categoria || "MODA & ESTILO",
                        publicado: Boolean(publicado !== undefined ? publicado : true),
                        usuario_id
                    })
                    .select("id");

                if (error && (error.code === "PGRST204" || error.message?.includes("categoria"))) {
                    // Fallback transparente caso a coluna categoria ainda não tenha sido criada no Supabase
                    const retry = await supabase
                        .from("posts")
                        .insert({
                            titulo,
                            resumo,
                            conteudo,
                            imagem,
                            publicado: Boolean(publicado !== undefined ? publicado : true),
                            usuario_id
                        })
                        .select("id");
                    data = retry.data;
                    error = retry.error;
                }

                if (error) throw error;
                return [{ insertId: data[0]?.id }, []];
            }

            // 10. Tabela POSTS - DELETE
            if (upperSql.startsWith("DELETE FROM POSTS")) {
                const [id] = params;
                const { error } = await supabase.from("posts").delete().eq("id", id);
                if (error) throw error;
                return [{ affectedRows: 1 }, []];
            }

            // 11. Tabela POSTS - SELECT por id específico
            if (upperSql.includes("FROM POSTS") && (upperSql.includes("P.ID = ?") || upperSql.includes("WHERE ID = ?"))) {
                const [id] = params;
                const { data: posts, error } = await supabase
                    .from("posts")
                    .select("*")
                    .eq("id", id);

                if (error) throw error;
                if (!posts || posts.length === 0) return [[], []];

                const post = posts[0];
                // Busca autor
                const { data: user } = await supabase
                    .from("usuario")
                    .select("nome, foto")
                    .eq("id", post.usuario_id)
                    .single();

                // Contagem de likes e comentários
                let likes = 0;
                let total_comentarios = 0;
                try {
                    const { count: countLikes } = await supabase
                        .from("curtidas")
                        .select("*", { count: "exact", head: true })
                        .eq("post_id", id);
                    likes = countLikes || 0;
                } catch {}

                try {
                    const { count: countComments } = await supabase
                        .from("comentarios")
                        .select("*", { count: "exact", head: true })
                        .eq("post_id", id);
                    total_comentarios = countComments || 0;
                } catch {}

                const postFormatado = {
                    id: post.id,
                    usuario_id: post.usuario_id,
                    titulo: post.titulo,
                    conteudo: post.conteudo,
                    resumo: post.resumo,
                    imagem: post.imagem,
                    categoria: post.categoria || "MODA & ESTILO",
                    criando_em: post.criando_em,
                    publicado: post.publicado ? 1 : 0,
                    autor: user?.nome || "Autora Lumina",
                    autor_foto: user?.foto || null,
                    likes,
                    total_comentarios
                };

                return [[postFormatado], []];
            }

            // 12. Tabela POSTS - SELECT por usuario_id
            if (upperSql.includes("FROM POSTS") && upperSql.includes("USUARIO_ID = ?")) {
                const [userId] = params;
                const { data: posts, error } = await supabase
                    .from("posts")
                    .select("*")
                    .eq("usuario_id", userId)
                    .order("criando_em", { ascending: false });

                if (error) throw error;

                const { data: user } = await supabase
                    .from("usuario")
                    .select("nome, foto")
                    .eq("id", userId)
                    .single();

                const rows = (posts || []).map((p) => ({
                    id: p.id,
                    usuario_id: p.usuario_id,
                    titulo: p.titulo,
                    resumo: p.resumo,
                    conteudo: p.conteudo,
                    imagem: p.imagem,
                    categoria: p.categoria || "MODA & ESTILO",
                    criando_em: p.criando_em,
                    publicado: p.publicado ? 1 : 0,
                    autor: user?.nome || "Autora Lumina",
                    autor_foto: user?.foto || null,
                    likes: 0,
                    total_comentarios: 0
                }));

                return [rows, []];
            }

            // 13. Tabela POSTS - SELECT geral (listarPublicos)
            if (upperSql.includes("FROM POSTS")) {
                const { data: posts, error } = await supabase
                    .from("posts")
                    .select("*")
                    .order("criando_em", { ascending: false });

                if (error) throw error;
                if (!posts || posts.length === 0) return [[], []];

                const userIds = [...new Set(posts.map((p) => p.usuario_id).filter(Boolean))];
                let userMap = {};
                if (userIds.length > 0) {
                    const { data: users } = await supabase
                        .from("usuario")
                        .select("id, nome, foto")
                        .in("id", userIds);
                    userMap = (users || []).reduce((acc, u) => {
                        acc[u.id] = u;
                        return acc;
                    }, {});
                }

                const postIds = posts.map((p) => p.id);
                let likesMap = {};
                let commentsMap = {};

                try {
                    const { data: likes } = await supabase
                        .from("curtidas")
                        .select("post_id")
                        .in("post_id", postIds);
                    (likes || []).forEach((l) => {
                        likesMap[l.post_id] = (likesMap[l.post_id] || 0) + 1;
                    });
                } catch {}

                try {
                    const { data: comments } = await supabase
                        .from("comentarios")
                        .select("post_id")
                        .in("post_id", postIds);
                    (comments || []).forEach((c) => {
                        commentsMap[c.post_id] = (commentsMap[c.post_id] || 0) + 1;
                    });
                } catch {}

                const rows = posts.map((p) => ({
                    id: p.id,
                    usuario_id: p.usuario_id,
                    titulo: p.titulo,
                    resumo: p.resumo,
                    imagem: p.imagem,
                    categoria: p.categoria || "MODA & ESTILO",
                    criando_em: p.criando_em,
                    publicado: p.publicado ? 1 : 0,
                    autor: userMap[p.usuario_id]?.nome || "Autora Lumina",
                    autor_foto: userMap[p.usuario_id]?.foto || null,
                    likes: likesMap[p.id] || 0,
                    total_comentarios: commentsMap[p.id] || 0
                }));

                return [rows, []];
            }

            // 14. Tabela CURTIDAS - operações
            if (upperSql.includes("FROM CURTIDAS") && upperSql.includes("USUARIO_ID = ?") && upperSql.includes("POST_ID = ?")) {
                const [userId, postId] = params;
                const { data } = await supabase
                    .from("curtidas")
                    .select("id")
                    .eq("usuario_id", userId)
                    .eq("post_id", postId);
                return [data || [], []];
            }

            if (upperSql.includes("INSERT INTO CURTIDAS")) {
                const [userId, postId] = params;
                await supabase.from("curtidas").insert({ usuario_id: userId, post_id: postId });
                return [{ affectedRows: 1 }, []];
            }

            if (upperSql.includes("DELETE FROM CURTIDAS")) {
                const [userId, postId] = params;
                await supabase.from("curtidas").delete().eq("usuario_id", userId).eq("post_id", postId);
                return [{ affectedRows: 1 }, []];
            }

            if (upperSql.includes("COUNT(*)") && upperSql.includes("FROM CURTIDAS") && upperSql.includes("POST_ID = ?")) {
                const [postId] = params;
                const { count } = await supabase
                    .from("curtidas")
                    .select("*", { count: "exact", head: true })
                    .eq("post_id", postId);
                return [[{ total: count || 0 }], []];
            }

            // 15. Tabela COMENTARIOS - SELECT por post_id
            if (upperSql.includes("FROM COMENTARIOS") && upperSql.includes("POST_ID = ?")) {
                const [postId] = params;
                const { data: comments, error } = await supabase
                    .from("comentarios")
                    .select("id, post_id, usuario_id, texto, criado_em")
                    .eq("post_id", postId)
                    .order("criado_em", { ascending: true });

                if (error || !comments) return [[], []];

                const uIds = [...new Set(comments.map((c) => c.usuario_id).filter(Boolean))];
                let uMap = {};
                if (uIds.length > 0) {
                    const { data: users } = await supabase
                        .from("usuario")
                        .select("id, nome, foto")
                        .in("id", uIds);
                    uMap = (users || []).reduce((acc, u) => {
                        acc[u.id] = u;
                        return acc;
                    }, {});
                }

                const rows = comments.map((c) => ({
                    id: c.id,
                    texto: c.texto,
                    criado_em: c.criado_em,
                    usuario_id: c.usuario_id,
                    autor: uMap[c.usuario_id]?.nome || "Usuária",
                    autor_foto: uMap[c.usuario_id]?.foto || null
                }));

                return [rows, []];
            }

            // 16. Tabela COMENTARIOS - INSERT
            if (upperSql.includes("INSERT INTO COMENTARIOS")) {
                const [postId, userId, texto] = params;
                const { data, error } = await supabase
                    .from("comentarios")
                    .insert({ post_id: postId, usuario_id: userId, texto })
                    .select("id");

                if (error) throw error;
                return [{ insertId: data[0]?.id }, []];
            }

            // 17. Tabela COMENTARIOS - SELECT por id específico
            if (upperSql.includes("FROM COMENTARIOS") && upperSql.includes("C.ID = ?")) {
                const [id] = params;
                const { data: comments } = await supabase
                    .from("comentarios")
                    .select("*")
                    .eq("id", id);

                if (!comments || comments.length === 0) return [[], []];
                const c = comments[0];
                const { data: u } = await supabase
                    .from("usuario")
                    .select("id, nome, foto")
                    .eq("id", c.usuario_id)
                    .single();

                return [
                    [
                        {
                            id: c.id,
                            texto: c.texto,
                            criado_em: c.criado_em,
                            usuario_id: c.usuario_id,
                            autor: u?.nome || "Usuária",
                            autor_foto: u?.foto || null
                        }
                    ],
                    []
                ];
            }

            // 18. Tabela CHAT_PUBLICO - SELECT
            if (upperSql.includes("FROM CHAT_PUBLICO")) {
                const { data: msgs, error } = await supabase
                    .from("chat_publico")
                    .select("*")
                    .order("criado_em", { ascending: true })
                    .limit(100);

                if (error || !msgs) return [[], []];

                const userIds = [...new Set(msgs.map((m) => m.usuario_id).filter(Boolean))];
                let uMap = {};
                if (userIds.length > 0) {
                    const { data: users } = await supabase
                        .from("usuario")
                        .select("id, nome, foto")
                        .in("id", userIds);
                    uMap = (users || []).reduce((acc, u) => {
                        acc[u.id] = u;
                        return acc;
                    }, {});
                }

                const rows = msgs.map((m) => ({
                    id: m.id,
                    usuario_id: m.usuario_id,
                    texto: m.texto,
                    criado_em: m.criado_em,
                    autor: uMap[m.usuario_id]?.nome || "Membro Lumina",
                    autor_foto: uMap[m.usuario_id]?.foto || null
                }));

                return [rows, []];
            }

            // 19. Tabela CHAT_PUBLICO - INSERT
            if (upperSql.includes("INSERT INTO CHAT_PUBLICO")) {
                const [userId, texto] = params;
                const { data, error } = await supabase
                    .from("chat_publico")
                    .insert({ usuario_id: userId, texto })
                    .select("id");

                if (error) throw error;
                return [{ insertId: data[0]?.id }, []];
            }

            console.warn("[Supabase Adapter] Consulta não mapeada diretamente:", cleanSql);
            return [[], []];
        }
    };
} else {
    // Fallback: MySQL local (XAMPP)
    const mysql = require("mysql2/promise");
    database = mysql.createPool({
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "",
        database: process.env.DB_NAME || "blog"
    });
}

module.exports = database;
