-- Migração 005: notificações do trabalhador.
-- Para bancos db_bico já criados com um schema.sql anterior. Quem criar o banco do zero
-- com o schema.sql atual NÃO precisa executar este script.
--
-- Cria a tabela notificacoes_leitura. As notificações em si não ganham tabela: elas vêm de
-- historico_candidaturas (candidatura aceita, recusada, recusada automaticamente ou bico cancelado).
-- Esta tabela guarda só até qual registro do histórico cada usuário já viu. Sem linha, tudo conta
-- como não lido.
--
-- Executar uma única vez, com o banco selecionado (USE db_bico).

USE db_bico;

CREATE TABLE IF NOT EXISTS notificacoes_leitura (
    usuario_id INT PRIMARY KEY,
    ultimo_lido_id INT NOT NULL DEFAULT 0,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_notificacoes_leitura_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
