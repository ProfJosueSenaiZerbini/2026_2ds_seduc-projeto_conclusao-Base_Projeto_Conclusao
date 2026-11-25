export const esquemaCena = `
CREATE TABLE IF NOT EXISTS catalogo_cena (
 tipo TEXT NOT NULL, id TEXT NOT NULL, chave TEXT NOT NULL UNIQUE,
 ficcional INTEGER NOT NULL DEFAULT 1 CHECK(ficcional IN(0,1)),
 dados_json TEXT NOT NULL DEFAULT '{}', versao INTEGER NOT NULL DEFAULT 1,
 atualizado_em INTEGER NOT NULL, PRIMARY KEY(tipo,id)
);
`;
