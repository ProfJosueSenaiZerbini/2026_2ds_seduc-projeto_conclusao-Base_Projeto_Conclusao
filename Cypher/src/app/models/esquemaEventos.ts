export const esquemaEventos = `
CREATE TABLE IF NOT EXISTS eventos_configuracoes (
 evento_id TEXT PRIMARY KEY REFERENCES eventos(id) ON DELETE RESTRICT,
 capacidade INTEGER CHECK(capacidade IS NULL OR capacidade BETWEEN 1 AND 100000),
 criterios TEXT NOT NULL DEFAULT '', fuso TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
 inicio_em INTEGER, fim_em INTEGER, latitude REAL, longitude REAL,
 local_confirmado INTEGER NOT NULL DEFAULT 0 CHECK(local_confirmado IN(0,1)),
 serie_id TEXT REFERENCES eventos(id), estado TEXT NOT NULL DEFAULT 'ativo' CHECK(estado IN('ativo','cancelado')),
 motivo_cancelamento TEXT NOT NULL DEFAULT '', versao INTEGER NOT NULL DEFAULT 1,
 CHECK((latitude IS NULL AND longitude IS NULL) OR (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)),
 CHECK(fim_em IS NULL OR inicio_em IS NULL OR fim_em>inicio_em)
);
CREATE TABLE IF NOT EXISTS eventos_inscricoes (
 id TEXT PRIMARY KEY, evento_id TEXT NOT NULL REFERENCES eventos(id) ON DELETE RESTRICT,
 usuario_id TEXT NOT NULL REFERENCES usuarios(id), estado TEXT NOT NULL CHECK(estado IN('pendente','confirmada','recusada','cancelada')),
 justificativa TEXT NOT NULL DEFAULT '', resposta TEXT NOT NULL DEFAULT '',
 criada_em INTEGER NOT NULL, atualizada_em INTEGER NOT NULL, versao INTEGER NOT NULL DEFAULT 1,
 UNIQUE(evento_id,usuario_id)
);
CREATE INDEX IF NOT EXISTS eventos_inscricoes_vagas ON eventos_inscricoes(evento_id,estado);
CREATE TABLE IF NOT EXISTS eventos_acompanhamentos (
 evento_id TEXT NOT NULL REFERENCES eventos(id) ON DELETE RESTRICT, usuario_id TEXT NOT NULL REFERENCES usuarios(id),
 interessado INTEGER NOT NULL DEFAULT 0 CHECK(interessado IN(0,1)), salvo INTEGER NOT NULL DEFAULT 0 CHECK(salvo IN(0,1)),
 lembrar24 INTEGER NOT NULL DEFAULT 1 CHECK(lembrar24 IN(0,1)), lembrar_dia INTEGER NOT NULL DEFAULT 1 CHECK(lembrar_dia IN(0,1)),
 fuso TEXT NOT NULL DEFAULT 'America/Sao_Paulo', criada_em INTEGER NOT NULL,
 PRIMARY KEY(evento_id,usuario_id)
);
CREATE TABLE IF NOT EXISTS eventos_presencas (
 evento_id TEXT NOT NULL REFERENCES eventos(id) ON DELETE RESTRICT, usuario_id TEXT NOT NULL REFERENCES usuarios(id),
 responsavel_id TEXT NOT NULL REFERENCES usuarios(id), evidencia TEXT NOT NULL, registrada_em INTEGER NOT NULL,
 revogada_em INTEGER, PRIMARY KEY(evento_id,usuario_id)
);
CREATE TABLE IF NOT EXISTS eventos_historico (
 id TEXT PRIMARY KEY, evento_id TEXT NOT NULL REFERENCES eventos(id) ON DELETE RESTRICT,
 autor_id TEXT NOT NULL REFERENCES usuarios(id), acao TEXT NOT NULL, detalhe TEXT NOT NULL DEFAULT '', criada_em INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS eventos_avaliacoes (
 id TEXT PRIMARY KEY, evento_id TEXT NOT NULL REFERENCES eventos(id) ON DELETE RESTRICT, usuario_id TEXT NOT NULL REFERENCES usuarios(id),
 positiva INTEGER NOT NULL CHECK(positiva IN(0,1)), justificativa TEXT NOT NULL DEFAULT '', criada_em INTEGER NOT NULL, invalidada_em INTEGER,
 UNIQUE(evento_id,usuario_id)
);
CREATE TABLE IF NOT EXISTS eventos_reclamacoes (
 id TEXT PRIMARY KEY, evento_id TEXT NOT NULL REFERENCES eventos(id) ON DELETE RESTRICT, usuario_id TEXT NOT NULL REFERENCES usuarios(id),
 descricao TEXT NOT NULL, evidencias TEXT NOT NULL DEFAULT '', estado TEXT NOT NULL DEFAULT 'pendente' CHECK(estado IN('pendente','reconhecida','contestada','moderacao')),
 resposta TEXT NOT NULL DEFAULT '', caso_suporte_id TEXT REFERENCES suporte_casos(id), criada_em INTEGER NOT NULL,
 UNIQUE(evento_id,usuario_id)
);
CREATE TABLE IF NOT EXISTS eventos_migracoes (chave TEXT PRIMARY KEY);
`;
