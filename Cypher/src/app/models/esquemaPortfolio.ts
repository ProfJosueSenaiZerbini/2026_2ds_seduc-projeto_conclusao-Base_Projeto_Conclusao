export const esquemaPortfolio = `
CREATE TABLE IF NOT EXISTS portfolio_config (
 usuario_id TEXT PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
 modo TEXT NOT NULL DEFAULT 'manual' CHECK(modo IN('manual','inteligente')),
 molde TEXT NOT NULL DEFAULT 'grade' CHECK(molde IN('grade','editorial','lista')),
 visivel INTEGER NOT NULL DEFAULT 0 CHECK(visivel IN(0,1)), atualizado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS portfolio_itens (
 usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 tipo TEXT NOT NULL CHECK(tipo IN('obra','beat','evento','projeto')), origem_id TEXT NOT NULL,
 selecionado INTEGER NOT NULL DEFAULT 0 CHECK(selecionado IN(0,1)),
 oculto INTEGER NOT NULL DEFAULT 0 CHECK(oculto IN(0,1)), destaque INTEGER NOT NULL DEFAULT 0 CHECK(destaque IN(0,1)),
 ordem INTEGER NOT NULL DEFAULT 0 CHECK(ordem BETWEEN 0 AND 100000), secao TEXT NOT NULL DEFAULT '' CHECK(length(secao)<=60),
 PRIMARY KEY(usuario_id,tipo,origem_id)
);
`;
