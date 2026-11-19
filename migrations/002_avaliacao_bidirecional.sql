-- Migração 002: avaliação bidirecional (contratante e trabalhador avaliam um ao outro).
-- Para bancos db_bico já criados com um schema.sql anterior. Quem criar o banco do zero
-- com o schema.sql atual NÃO precisa executar este script.
--
-- Mudanças na tabela avaliacoes:
--   1. UNIQUE (bico_id)  ->  UNIQUE (bico_id, avaliador_id): cada participante avalia o bico uma vez
--      (o contratante avalia o trabalhador e o trabalhador avalia o contratante).
--   2. Nova coluna criado_em (a data_atualizacao continua existindo).
--   3. CHECK (avaliador_id <> avaliado_id): ninguém avalia a si mesmo.
--
-- Funciona em banco com dados: as avaliações existentes continuam válidas (já eram uma por bico
-- e o avaliador sempre foi diferente do avaliado) e recebem criado_em = data_atualizacao.
-- A chave estrangeira fk_avaliacoes_bico usa o índice de bico_id; por isso o índice novo é criado
-- no mesmo ALTER que remove o antigo (o novo também começa por bico_id).
--
-- Executar uma única vez, com o banco selecionado (USE db_bico).

USE db_bico;

ALTER TABLE avaliacoes
    ADD COLUMN criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER comentario,
    ADD CONSTRAINT uk_avaliacoes_bico_avaliador UNIQUE (bico_id, avaliador_id),
    DROP INDEX uk_avaliacoes_bico,
    ADD CONSTRAINT chk_avaliacoes_participantes CHECK (avaliador_id <> avaliado_id);

-- Avaliações antigas: a data de criação passa a ser a última data conhecida.
-- (data_atualizacao = data_atualizacao evita que o ON UPDATE CURRENT_TIMESTAMP altere essa coluna.)
UPDATE avaliacoes SET criado_em = data_atualizacao, data_atualizacao = data_atualizacao;
