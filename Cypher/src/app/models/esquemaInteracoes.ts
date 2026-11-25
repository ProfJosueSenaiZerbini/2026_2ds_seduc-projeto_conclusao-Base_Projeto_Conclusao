export const esquemaInteracoes = `
CREATE TABLE IF NOT EXISTS profissionais_seguidos (
  seguidor_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  profissional_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(seguidor_id, profissional_id),
  CHECK(seguidor_id <> profissional_id)
);
CREATE INDEX IF NOT EXISTS seguidores_profissional ON profissionais_seguidos(profissional_id);

CREATE TABLE IF NOT EXISTS interacoes_conteudo (
  usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  acao TEXT NOT NULL CHECK(acao IN('salvar','curtir')),
  objeto_tipo TEXT NOT NULL CHECK(objeto_tipo IN('perfil','obra','beat','evento','projeto','oportunidade')),
  objeto_id TEXT NOT NULL,
  criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(usuario_id, acao, objeto_tipo, objeto_id)
);
CREATE INDEX IF NOT EXISTS interacoes_por_objeto ON interacoes_conteudo(objeto_tipo, objeto_id, acao);

CREATE TABLE IF NOT EXISTS comentarios_conteudo (
  id TEXT PRIMARY KEY,
  autor_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  objeto_tipo TEXT NOT NULL CHECK(objeto_tipo IN('obra','beat','evento','projeto','oportunidade')),
  objeto_id TEXT NOT NULL,
  texto TEXT NOT NULL CHECK(length(texto) <= 1500),
  criado_em INTEGER NOT NULL,
  editado_em INTEGER,
  excluido_em INTEGER,
  versao INTEGER NOT NULL DEFAULT 1,
  chave_envio TEXT NOT NULL,
  UNIQUE(autor_id, chave_envio)
);
CREATE INDEX IF NOT EXISTS comentarios_por_objeto ON comentarios_conteudo(objeto_tipo, objeto_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS comentarios_por_autor ON comentarios_conteudo(autor_id, criado_em);

CREATE TRIGGER IF NOT EXISTS desfazer_seguimento_ao_bloquear
AFTER INSERT ON bloqueios_usuarios
BEGIN
  DELETE FROM profissionais_seguidos
  WHERE (seguidor_id=NEW.autor_id AND profissional_id=NEW.alvo_id)
     OR (seguidor_id=NEW.alvo_id AND profissional_id=NEW.autor_id);
END;
`;
