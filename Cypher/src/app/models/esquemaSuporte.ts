export const esquemaSuporte = `
CREATE TABLE IF NOT EXISTS suporte_casos (
 id TEXT PRIMARY KEY, solicitante_id TEXT NOT NULL REFERENCES usuarios(id), afetado_id TEXT REFERENCES usuarios(id),
 tipo TEXT NOT NULL CHECK(tipo IN('ajuda','sugestao','denuncia','recurso')),
 assunto TEXT NOT NULL, descricao TEXT NOT NULL, motivo TEXT NOT NULL DEFAULT '',
 objeto_tipo TEXT NOT NULL DEFAULT '', objeto_id TEXT NOT NULL DEFAULT '', snapshot_json TEXT NOT NULL DEFAULT '{}',
 evidencias TEXT NOT NULL DEFAULT '', prioridade TEXT NOT NULL DEFAULT 'normal' CHECK(prioridade IN('normal','alta')),
 estado TEXT NOT NULL DEFAULT 'pendente' CHECK(estado IN('pendente','em_analise','resolvida','arquivada')),
 versao INTEGER NOT NULL DEFAULT 1, revisor_id TEXT REFERENCES usuarios(id), decisao TEXT NOT NULL DEFAULT '', resposta TEXT NOT NULL DEFAULT '',
 criada_em INTEGER NOT NULL, atualizada_em INTEGER NOT NULL, decidida_em INTEGER,
 recurso_de TEXT REFERENCES suporte_casos(id), chave_envio TEXT NOT NULL, hash_payload TEXT NOT NULL,
 UNIQUE(solicitante_id,chave_envio)
);
CREATE INDEX IF NOT EXISTS suporte_fila ON suporte_casos(estado,prioridade,criada_em);
CREATE INDEX IF NOT EXISTS suporte_solicitante ON suporte_casos(solicitante_id,criada_em);
CREATE INDEX IF NOT EXISTS suporte_afetado ON suporte_casos(afetado_id,criada_em);
CREATE UNIQUE INDEX IF NOT EXISTS suporte_recurso_pendente ON suporte_casos(recurso_de,solicitante_id)
 WHERE recurso_de IS NOT NULL AND estado IN('pendente','em_analise');
CREATE TABLE IF NOT EXISTS suporte_eventos (
 id TEXT PRIMARY KEY, caso_id TEXT NOT NULL REFERENCES suporte_casos(id), autor_id TEXT NOT NULL REFERENCES usuarios(id),
 acao TEXT NOT NULL, texto TEXT NOT NULL DEFAULT '',
 visibilidade TEXT NOT NULL CHECK(visibilidade IN('solicitante','afetado','ambos','interno')), criada_em INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS suporte_medidas (
 id TEXT PRIMARY KEY, caso_id TEXT NOT NULL REFERENCES suporte_casos(id), autor_id TEXT NOT NULL REFERENCES usuarios(id),
 acao TEXT NOT NULL CHECK(acao IN('advertir','ocultar','remover','restringir_contato','suspender','excluir_conta')),
 alvo_tipo TEXT NOT NULL CHECK(alvo_tipo IN('perfil','obra','beat','evento','projeto','midia','oportunidade','mensagem','comentario','selo')),
 alvo_id TEXT NOT NULL, motivo TEXT NOT NULL, criada_em INTEGER NOT NULL, ate INTEGER, revogada_em INTEGER,
 UNIQUE(caso_id,acao,alvo_tipo,alvo_id)
);
CREATE INDEX IF NOT EXISTS suporte_medidas_alvo ON suporte_medidas(alvo_tipo,alvo_id,revogada_em,ate);
CREATE TABLE IF NOT EXISTS suporte_acessos (
 id TEXT PRIMARY KEY, caso_id TEXT NOT NULL REFERENCES suporte_casos(id), autor_id TEXT NOT NULL REFERENCES usuarios(id),
 motivo TEXT NOT NULL, criada_em INTEGER NOT NULL
);
`;
