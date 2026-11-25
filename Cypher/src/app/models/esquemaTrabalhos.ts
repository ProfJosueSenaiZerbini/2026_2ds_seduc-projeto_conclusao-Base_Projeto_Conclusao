// Complementa projetos existentes sem recriar registros referenciados por oportunidades.
export const esquemaTrabalhos = `
CREATE TABLE IF NOT EXISTS detalhes_projetos (
 projeto_id TEXT PRIMARY KEY REFERENCES projetos_trabalho(id),
 modalidade TEXT NOT NULL, profissoes_json TEXT NOT NULL DEFAULT '[]',
 objetivo TEXT NOT NULL DEFAULT '', inicio TEXT NOT NULL DEFAULT '', fim TEXT NOT NULL DEFAULT '',
 papel TEXT NOT NULL DEFAULT '', equipe TEXT NOT NULL DEFAULT '', entregas TEXT NOT NULL DEFAULT '',
 resultados TEXT NOT NULL DEFAULT '', texto TEXT NOT NULL DEFAULT '',
 retirado INTEGER NOT NULL DEFAULT 0 CHECK(retirado IN(0,1)), atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS midias_trabalho (
 id TEXT PRIMARY KEY, autor_id TEXT NOT NULL REFERENCES usuarios(id), nome TEXT NOT NULL,
 mime TEXT NOT NULL, bytes INTEGER NOT NULL, publico INTEGER NOT NULL DEFAULT 0 CHECK(publico IN(0,1)),
 criada_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS itens_projeto (
 projeto_id TEXT NOT NULL REFERENCES projetos_trabalho(id),
 tipo TEXT NOT NULL CHECK(tipo IN('midia','projeto','obra','beat','evento','link')),
 origem_id TEXT NOT NULL, legenda TEXT NOT NULL DEFAULT '', ordem INTEGER NOT NULL,
 PRIMARY KEY(projeto_id,tipo,origem_id)
);
CREATE INDEX IF NOT EXISTS indice_itens_origem ON itens_projeto(tipo,origem_id);
CREATE TABLE IF NOT EXISTS historico_projetos (
 id TEXT PRIMARY KEY, projeto_id TEXT NOT NULL REFERENCES projetos_trabalho(id),
 autor_id TEXT NOT NULL REFERENCES usuarios(id), acao TEXT NOT NULL, dados_json TEXT NOT NULL,
 criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;
