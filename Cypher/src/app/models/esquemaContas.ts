export const esquemaContas = `
CREATE TABLE IF NOT EXISTS consentimentos_conta (
 usuario_id TEXT PRIMARY KEY REFERENCES usuarios(id), versao_termos TEXT NOT NULL,
 versao_privacidade TEXT NOT NULL, aceito_em INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS encerramentos_conta (
 usuario_id TEXT PRIMARY KEY REFERENCES usuarios(id), encerrada_em INTEGER NOT NULL,
 motivo_preservacao TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS tokens_recuperacao_senha (
 token_hash TEXT PRIMARY KEY, usuario_id TEXT NOT NULL REFERENCES usuarios(id),
 email_destino TEXT NOT NULL, criado_em INTEGER NOT NULL, expira_em INTEGER NOT NULL, usado_em INTEGER
);
CREATE INDEX IF NOT EXISTS recuperacao_usuario ON tokens_recuperacao_senha(usuario_id,criado_em);
`;
