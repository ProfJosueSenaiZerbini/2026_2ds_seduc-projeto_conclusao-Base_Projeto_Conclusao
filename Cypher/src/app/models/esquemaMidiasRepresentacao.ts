export const esquemaMidiasRepresentacao = `
CREATE TABLE IF NOT EXISTS midias_publicacoes (
 id TEXT PRIMARY KEY, autor_id TEXT NOT NULL REFERENCES usuarios(id),
 objeto_tipo TEXT NOT NULL CHECK(objeto_tipo IN('perfil','obra','beat','evento','projeto')),
 objeto_id TEXT NOT NULL, finalidade TEXT NOT NULL CHECK(finalidade IN('imagem','audio','video','texto')),
 nome TEXT NOT NULL, mime TEXT NOT NULL, bytes INTEGER NOT NULL,
 criado_em INTEGER NOT NULL, retirada_em INTEGER
);
CREATE INDEX IF NOT EXISTS midias_publicacoes_autor ON midias_publicacoes(autor_id);
CREATE TABLE IF NOT EXISTS selos_perfil (
 id TEXT PRIMARY KEY, autor_id TEXT NOT NULL REFERENCES usuarios(id),
 letras TEXT NOT NULL, forma TEXT NOT NULL, cor TEXT NOT NULL,
 criado_em INTEGER NOT NULL, retirado_em INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS selo_perfil_ativo ON selos_perfil(autor_id) WHERE retirado_em IS NULL;
CREATE TABLE IF NOT EXISTS pedidos_selo_externo (
 id TEXT PRIMARY KEY, autor_id TEXT NOT NULL REFERENCES usuarios(id),
 imagem BLOB NOT NULL, mime TEXT NOT NULL CHECK(mime IN('image/png','image/jpeg')),
 justificativa TEXT NOT NULL, estado TEXT NOT NULL CHECK(estado IN('pendente','aprovado','recusado')),
 criado_em INTEGER NOT NULL, decidido_em INTEGER, revisor_id TEXT REFERENCES administradores(usuario_id),
 motivo TEXT, selo_id TEXT UNIQUE REFERENCES selos_perfil(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS pedido_selo_pendente ON pedidos_selo_externo(autor_id) WHERE estado='pendente';
CREATE TABLE IF NOT EXISTS creditos_publicacoes (
 id TEXT PRIMARY KEY, tipo TEXT NOT NULL CHECK(tipo IN('beat','evento')),
 objeto_id TEXT NOT NULL, usuario_id TEXT NOT NULL REFERENCES usuarios(id),
 funcao TEXT NOT NULL, categoria TEXT NOT NULL,
 confirmado INTEGER NOT NULL DEFAULT 0 CHECK(confirmado IN(0,1)),
 retirado_em INTEGER, criado_em INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS credito_publicacao_ativo
 ON creditos_publicacoes(tipo,objeto_id,usuario_id,funcao,categoria) WHERE retirado_em IS NULL;
CREATE TABLE IF NOT EXISTS historico_creditos (
 id INTEGER PRIMARY KEY, credito_id TEXT NOT NULL,
 tipo TEXT NOT NULL CHECK(tipo IN('obra','beat','evento')),
 ator_id TEXT NOT NULL REFERENCES usuarios(id),
 estado TEXT NOT NULL CHECK(estado IN('confirmado','recusado','contestado','validado','invalidado')),
 motivo TEXT NOT NULL DEFAULT '', criado_em INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS historico_credito_registro ON historico_creditos(tipo,credito_id,id DESC);
CREATE TABLE IF NOT EXISTS representacoes_profissionais (
 id TEXT PRIMARY KEY, representante_id TEXT NOT NULL REFERENCES usuarios(id),
 representado_id TEXT NOT NULL REFERENCES usuarios(id), proponente_id TEXT NOT NULL REFERENCES usuarios(id),
 escopo TEXT NOT NULL, estado TEXT NOT NULL CHECK(estado IN('pendente','ativa','recusada','cancelada','encerrada')),
 versao INTEGER NOT NULL DEFAULT 1, criada_em INTEGER NOT NULL, atualizada_em INTEGER NOT NULL,
 CHECK(representante_id<>representado_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS representacao_vigente
 ON representacoes_profissionais(representante_id,representado_id) WHERE estado IN('pendente','ativa');
CREATE INDEX IF NOT EXISTS representacoes_representado ON representacoes_profissionais(representado_id,atualizada_em);
CREATE TABLE IF NOT EXISTS historico_representacao (
 id TEXT PRIMARY KEY, representacao_id TEXT NOT NULL REFERENCES representacoes_profissionais(id),
 autor_id TEXT NOT NULL REFERENCES usuarios(id), acao TEXT NOT NULL, motivo TEXT NOT NULL DEFAULT '', criado_em INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS historico_representacao_vinculo ON historico_representacao(representacao_id,criado_em);
`;
