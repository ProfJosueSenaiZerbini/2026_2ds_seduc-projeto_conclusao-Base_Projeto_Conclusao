// Migração aditiva, executada na transação e conexão oficiais da aplicação.
export const esquemaOportunidades = `
CREATE TABLE IF NOT EXISTS operacoes_oportunidade (
 autor_id TEXT NOT NULL REFERENCES usuarios(id), chave TEXT NOT NULL, tipo TEXT NOT NULL, resultado_id TEXT NOT NULL,
 criada_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(autor_id,chave,tipo)
);
CREATE TABLE IF NOT EXISTS restricoes_contas (
 usuario_id TEXT PRIMARY KEY REFERENCES usuarios(id), motivo TEXT NOT NULL,
 administrador_id TEXT NOT NULL REFERENCES usuarios(id), ate TEXT, criada_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS bloqueios_usuarios (
 autor_id TEXT NOT NULL REFERENCES usuarios(id), alvo_id TEXT NOT NULL REFERENCES usuarios(id),
 criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(autor_id,alvo_id), CHECK(autor_id<>alvo_id)
);
CREATE TABLE IF NOT EXISTS preferencias_contato (
 usuario_id TEXT PRIMARY KEY REFERENCES usuarios(id), profissionais INTEGER NOT NULL DEFAULT 1 CHECK(profissionais IN(0,1)),
 consumidores INTEGER NOT NULL DEFAULT 0 CHECK(consumidores IN(0,1))
);
CREATE TABLE IF NOT EXISTS projetos_trabalho (
 id TEXT PRIMARY KEY, autor_id TEXT NOT NULL REFERENCES usuarios(id), titulo TEXT NOT NULL, descricao TEXT NOT NULL,
 publico INTEGER NOT NULL DEFAULT 0 CHECK(publico IN(0,1)), criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS pedidos_oportunidade (
 id TEXT PRIMARY KEY, solicitante_id TEXT NOT NULL REFERENCES usuarios(id), dados_json TEXT NOT NULL,
 estado TEXT NOT NULL CHECK(estado IN('pendente','esclarecimento','aprovado','recusado')),
 revisor_id TEXT REFERENCES usuarios(id), justificativa TEXT NOT NULL DEFAULT '', criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS oportunidades_profissionais (
 id TEXT PRIMARY KEY, autor_id TEXT NOT NULL REFERENCES usuarios(id), titulo TEXT NOT NULL,
 tipo TEXT NOT NULL CHECK(tipo IN('servico','projeto','colaboracao','vaga')), descricao TEXT NOT NULL, contexto TEXT NOT NULL DEFAULT '',
 modalidade TEXT NOT NULL CHECK(modalidade IN('remoto','presencial','hibrido')), localizacao TEXT NOT NULL DEFAULT '',
 remuneracao TEXT NOT NULL CHECK(remuneracao IN('a_combinar','remunerada','colaboracao')),
 valor_centavos INTEGER CHECK(valor_centavos>=0), unidade TEXT NOT NULL DEFAULT 'projeto' CHECK(unidade IN('projeto','hora','mes')),
 condicoes TEXT NOT NULL DEFAULT '', inicio TEXT, fim TEXT, prazo TEXT,
 evento_id TEXT REFERENCES eventos(id), projeto_id TEXT REFERENCES projetos_trabalho(id),
 pedido_id TEXT UNIQUE REFERENCES pedidos_oportunidade(id),
 estado TEXT NOT NULL CHECK(estado IN('rascunho','aberta','pausada','encerrada','expirada','cancelada')),
 revisao INTEGER NOT NULL DEFAULT 1, criada_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, publicada_em TEXT
);
CREATE INDEX IF NOT EXISTS indice_oportunidades_estado ON oportunidades_profissionais(estado,publicada_em);
CREATE INDEX IF NOT EXISTS indice_oportunidades_autor ON oportunidades_profissionais(autor_id);
CREATE TABLE IF NOT EXISTS funcoes_oportunidade (
 id TEXT PRIMARY KEY, oportunidade_id TEXT NOT NULL REFERENCES oportunidades_profissionais(id), profissao_id TEXT NOT NULL,
 vagas INTEGER NOT NULL CHECK(vagas BETWEEN 1 AND 1000), responsabilidades TEXT NOT NULL, requisitos TEXT NOT NULL DEFAULT '',
 desejaveis TEXT NOT NULL DEFAULT '', UNIQUE(oportunidade_id,profissao_id)
);
CREATE TABLE IF NOT EXISTS candidaturas_oportunidade (
 id TEXT PRIMARY KEY, oportunidade_id TEXT NOT NULL REFERENCES oportunidades_profissionais(id), funcao_id TEXT NOT NULL REFERENCES funcoes_oportunidade(id),
 candidato_id TEXT NOT NULL REFERENCES usuarios(id), apresentacao TEXT NOT NULL DEFAULT '',
 estado TEXT NOT NULL CHECK(estado IN('enviada','analise','selecionada','recusada','retirada','acordo')),
 criada_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS candidatura_ativa_unica ON candidaturas_oportunidade(oportunidade_id,candidato_id) WHERE estado NOT IN('retirada','recusada');
CREATE TABLE IF NOT EXISTS propostas_oportunidade (
 id TEXT PRIMARY KEY, candidatura_id TEXT NOT NULL REFERENCES candidaturas_oportunidade(id), versao INTEGER NOT NULL,
 autor_id TEXT NOT NULL REFERENCES usuarios(id), termos_json TEXT NOT NULL,
 estado TEXT NOT NULL CHECK(estado IN('enviada','substituida','recusada','confirmada')), criada_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(candidatura_id,versao)
);
CREATE TABLE IF NOT EXISTS aceites_oportunidade (
 proposta_id TEXT NOT NULL REFERENCES propostas_oportunidade(id), usuario_id TEXT NOT NULL REFERENCES usuarios(id),
 criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(proposta_id,usuario_id)
);
CREATE TABLE IF NOT EXISTS acordos_oportunidade (
 id TEXT PRIMARY KEY, candidatura_id TEXT NOT NULL UNIQUE REFERENCES candidaturas_oportunidade(id),
 proposta_id TEXT NOT NULL UNIQUE REFERENCES propostas_oportunidade(id), funcao_id TEXT NOT NULL REFERENCES funcoes_oportunidade(id),
 estado TEXT NOT NULL DEFAULT 'confirmado' CHECK(estado IN('confirmado','desfeito')), criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS desistencias_acordo (
 acordo_id TEXT NOT NULL REFERENCES acordos_oportunidade(id), usuario_id TEXT NOT NULL REFERENCES usuarios(id),
 motivo TEXT NOT NULL, criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(acordo_id,usuario_id)
);
CREATE TABLE IF NOT EXISTS historico_oportunidades (
 id TEXT PRIMARY KEY, oportunidade_id TEXT REFERENCES oportunidades_profissionais(id), pedido_id TEXT REFERENCES pedidos_oportunidade(id),
 autor_id TEXT REFERENCES usuarios(id), acao TEXT NOT NULL, dados_json TEXT NOT NULL, criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS conversas (
 id TEXT PRIMARY KEY, participante_a TEXT NOT NULL REFERENCES usuarios(id), participante_b TEXT NOT NULL REFERENCES usuarios(id),
 candidatura_id TEXT UNIQUE REFERENCES candidaturas_oportunidade(id), contexto TEXT NOT NULL, criada_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK(participante_a<>participante_b)
);
CREATE TABLE IF NOT EXISTS mensagens (
 id TEXT PRIMARY KEY, conversa_id TEXT NOT NULL REFERENCES conversas(id), autor_id TEXT NOT NULL REFERENCES usuarios(id),
 texto TEXT NOT NULL, chave TEXT NOT NULL, criada_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(autor_id,chave)
);
CREATE INDEX IF NOT EXISTS indice_mensagens_conversa ON mensagens(conversa_id,criada_em);
CREATE TRIGGER IF NOT EXISTS preservar_termos_oportunidade BEFORE UPDATE OF termos_json,versao,candidatura_id,autor_id ON propostas_oportunidade
BEGIN SELECT RAISE(ABORT,'VERSAO_IMUTAVEL'); END;
CREATE TRIGGER IF NOT EXISTS validar_acordo_oportunidade BEFORE INSERT ON acordos_oportunidade BEGIN
 SELECT CASE WHEN NOT EXISTS (
 SELECT 1 FROM candidaturas_oportunidade c JOIN oportunidades_profissionais o ON o.id=c.oportunidade_id
 JOIN propostas_oportunidade p ON p.candidatura_id=c.id
 WHERE c.id=NEW.candidatura_id AND p.id=NEW.proposta_id AND c.funcao_id=NEW.funcao_id AND c.estado='selecionada'
 AND p.estado='enviada' AND o.estado='aberta' AND (o.prazo IS NULL OR datetime(o.prazo)>datetime('now'))
 AND EXISTS(SELECT 1 FROM aceites_oportunidade WHERE proposta_id=p.id AND usuario_id=c.candidato_id)
 AND EXISTS(SELECT 1 FROM aceites_oportunidade WHERE proposta_id=p.id AND usuario_id=o.autor_id)
 AND p.versao=(SELECT MAX(versao) FROM propostas_oportunidade WHERE candidatura_id=c.id)
 ) THEN RAISE(ABORT,'ACORDO_INVALIDO') END;
 SELECT CASE WHEN (SELECT COUNT(*) FROM acordos_oportunidade WHERE funcao_id=NEW.funcao_id AND estado='confirmado') >=
 (SELECT vagas FROM funcoes_oportunidade WHERE id=NEW.funcao_id) THEN RAISE(ABORT,'SEM_VAGA') END;
END;
`;
