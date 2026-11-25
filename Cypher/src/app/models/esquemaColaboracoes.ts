export const esquemaColaboracoes = `
CREATE TABLE IF NOT EXISTS colaboracoes (
 id TEXT PRIMARY KEY, proponente_id TEXT NOT NULL REFERENCES usuarios(id), convidado_id TEXT NOT NULL REFERENCES usuarios(id),
 dupla TEXT NOT NULL, chave_contexto TEXT NOT NULL, titulo TEXT NOT NULL, natureza TEXT NOT NULL, descricao TEXT NOT NULL,
 funcao_proponente TEXT NOT NULL, funcao_convidado TEXT NOT NULL, periodo TEXT NOT NULL DEFAULT '',
 origem_tipo TEXT NOT NULL DEFAULT '', origem_id TEXT NOT NULL DEFAULT '',
 exige_lancamento INTEGER NOT NULL DEFAULT 0 CHECK(exige_lancamento IN(0,1)), evidencia_url TEXT NOT NULL DEFAULT '', evidencia_descricao TEXT NOT NULL DEFAULT '',
 estado TEXT NOT NULL CHECK(estado IN('pendente_aceite','em_andamento','conclusao_pendente','contestada','concluida','recusada','cancelada','expirada','invalidada')),
 criada_em INTEGER NOT NULL, aceita_em INTEGER, pedido_conclusao_por TEXT REFERENCES usuarios(id), pedido_conclusao_em INTEGER,
 concluida_em INTEGER, prazo_avaliacao_em INTEGER, cancelamento_por TEXT REFERENCES usuarios(id), cancelamento_em INTEGER,
 publico_a INTEGER NOT NULL DEFAULT 0 CHECK(publico_a IN(0,1)), publico_b INTEGER NOT NULL DEFAULT 0 CHECK(publico_b IN(0,1)),
 versao INTEGER NOT NULL DEFAULT 1, CHECK(proponente_id<>convidado_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS colaboracao_contexto_ativo ON colaboracoes(dupla,chave_contexto)
 WHERE estado IN('pendente_aceite','em_andamento','conclusao_pendente','contestada','concluida');
CREATE INDEX IF NOT EXISTS colaboracoes_partes ON colaboracoes(proponente_id,convidado_id,estado);
CREATE TABLE IF NOT EXISTS avaliacoes_colaboracao (
 id TEXT PRIMARY KEY, colaboracao_id TEXT NOT NULL REFERENCES colaboracoes(id),
 avaliador_id TEXT NOT NULL REFERENCES usuarios(id), avaliado_id TEXT NOT NULL REFERENCES usuarios(id),
 comunicacao INTEGER NOT NULL CHECK(typeof(comunicacao)='integer' AND comunicacao BETWEEN 1 AND 5),
 combinados INTEGER NOT NULL CHECK(typeof(combinados)='integer' AND combinados BETWEEN 1 AND 5),
 equipe INTEGER NOT NULL CHECK(typeof(equipe)='integer' AND equipe BETWEEN 1 AND 5),
 comentario TEXT NOT NULL DEFAULT '' CHECK(length(comentario)<=1000), enviada_em INTEGER NOT NULL,
 estado TEXT NOT NULL DEFAULT 'ativa' CHECK(estado IN('ativa','oculta','invalidada')), comentario_oculto INTEGER NOT NULL DEFAULT 0 CHECK(comentario_oculto IN(0,1)),
 estado_antes_vinculo TEXT CHECK(estado_antes_vinculo IN('ativa','oculta')),
 UNIQUE(colaboracao_id,avaliador_id), CHECK(avaliador_id<>avaliado_id)
);
CREATE INDEX IF NOT EXISTS avaliacoes_recebidas ON avaliacoes_colaboracao(avaliado_id,estado);
CREATE TRIGGER IF NOT EXISTS avaliacao_participantes BEFORE INSERT ON avaliacoes_colaboracao BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM colaboracoes c WHERE c.id=NEW.colaboracao_id AND c.estado='concluida'
 AND ((c.proponente_id=NEW.avaliador_id AND c.convidado_id=NEW.avaliado_id) OR (c.convidado_id=NEW.avaliador_id AND c.proponente_id=NEW.avaliado_id)))
 THEN RAISE(ABORT,'AVALIACAO_SEM_VINCULO_VALIDO') END;
END;
CREATE TRIGGER IF NOT EXISTS avaliacao_imutavel BEFORE UPDATE OF colaboracao_id,avaliador_id,avaliado_id,comunicacao,combinados,equipe,comentario,enviada_em ON avaliacoes_colaboracao
 BEGIN SELECT RAISE(ABORT,'AVALIACAO_IMUTAVEL'); END;
CREATE TABLE IF NOT EXISTS casos_colaboracao (
 id TEXT PRIMARY KEY, colaboracao_id TEXT NOT NULL REFERENCES colaboracoes(id), avaliacao_id TEXT REFERENCES avaliacoes_colaboracao(id),
 autor_id TEXT NOT NULL REFERENCES usuarios(id), motivo TEXT NOT NULL, detalhes TEXT NOT NULL, evidencias TEXT NOT NULL DEFAULT '',
 estado TEXT NOT NULL DEFAULT 'aberta' CHECK(estado IN('aberta','em_analise','decidida','recorrida','encerrada')),
 criada_em INTEGER NOT NULL, revisada_em INTEGER, revisor_id TEXT REFERENCES usuarios(id), decisao TEXT NOT NULL DEFAULT '', justificativa TEXT NOT NULL DEFAULT '',
 recurso_de TEXT REFERENCES casos_colaboracao(id)
);
CREATE TABLE IF NOT EXISTS manifestacoes_colaboracao (
 caso_id TEXT NOT NULL REFERENCES casos_colaboracao(id), autor_id TEXT NOT NULL REFERENCES usuarios(id), texto TEXT NOT NULL, criada_em INTEGER NOT NULL,
 PRIMARY KEY(caso_id,autor_id)
);
CREATE TABLE IF NOT EXISTS historico_colaboracao (
 id TEXT PRIMARY KEY, colaboracao_id TEXT NOT NULL REFERENCES colaboracoes(id), autor_id TEXT REFERENCES usuarios(id),
 acao TEXT NOT NULL, estado_anterior TEXT NOT NULL, estado_novo TEXT NOT NULL, justificativa TEXT NOT NULL DEFAULT '', ocorrida_em INTEGER NOT NULL
);
`;
