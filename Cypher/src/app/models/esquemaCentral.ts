export const esquemaCentral = `
CREATE TABLE IF NOT EXISTS central_artigos (
 id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, autor_id TEXT NOT NULL REFERENCES usuarios(id),
 estado TEXT NOT NULL DEFAULT 'rascunho' CHECK(estado IN('rascunho','em_revisao','publicado','arquivado')),
 rascunho_json TEXT NOT NULL, publicado_json TEXT, versao INTEGER NOT NULL DEFAULT 1,
 criada_em INTEGER NOT NULL, atualizado_em INTEGER NOT NULL, publicado_em INTEGER
);
CREATE TABLE IF NOT EXISTS central_revisoes (
 id TEXT PRIMARY KEY, artigo_id TEXT NOT NULL REFERENCES central_artigos(id), autor_id TEXT NOT NULL REFERENCES usuarios(id),
 acao TEXT NOT NULL, motivo TEXT NOT NULL, conteudo_json TEXT NOT NULL, criado_em INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS central_visitas (
 artigo_id TEXT NOT NULL REFERENCES central_artigos(id), usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 dia TEXT NOT NULL, acessos INTEGER NOT NULL DEFAULT 1, ultimo_em INTEGER NOT NULL,
 PRIMARY KEY(artigo_id,usuario_id,dia)
);
CREATE TABLE IF NOT EXISTS central_feedback (
 artigo_id TEXT NOT NULL REFERENCES central_artigos(id), usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 util INTEGER NOT NULL CHECK(util IN(0,1)), motivo TEXT NOT NULL DEFAULT '', comentario TEXT NOT NULL DEFAULT '',
 criado_em INTEGER NOT NULL, atualizado_em INTEGER NOT NULL, PRIMARY KEY(artigo_id,usuario_id)
);
CREATE TABLE IF NOT EXISTS central_feedback_eventos (
 id TEXT PRIMARY KEY, artigo_id TEXT NOT NULL REFERENCES central_artigos(id), usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 util INTEGER NOT NULL CHECK(util IN(0,1)), motivo TEXT NOT NULL DEFAULT '', criado_em INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS central_preferencias (
 usuario_id TEXT PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE, pesquisas INTEGER NOT NULL DEFAULT 0 CHECK(pesquisas IN(0,1))
);
CREATE TABLE IF NOT EXISTS central_lacunas (
 termo TEXT NOT NULL, categoria TEXT NOT NULL, dia TEXT NOT NULL, total INTEGER NOT NULL DEFAULT 1,
 PRIMARY KEY(termo,categoria,dia)
);
CREATE TABLE IF NOT EXISTS central_buscas_dedupe (
 chave TEXT PRIMARY KEY, dia TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS central_parametros (
 chave TEXT PRIMARY KEY, valor TEXT NOT NULL
);
`;
