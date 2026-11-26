-- Migração 001: cancelamento de bico com estorno simulado.
-- Para bancos db_bico já criados com um schema.sql anterior. Quem criar o banco do zero
-- com o schema.sql atual NÃO precisa executar este script.
--
-- Adiciona o valor 'ESTORNO' ao ENUM movimentacoes_carteira.tipo_movimentacao.
-- Os valores existentes mantêm a mesma ordem, então nenhuma linha é alterada.
-- A restrição UNIQUE (bico_id, tipo_movimentacao) continua valendo e permite no máximo
-- um ESTORNO por bico. Todos os valores financeiros são simulados.
--
-- Executar uma única vez, com o banco selecionado (USE db_bico).

USE db_bico;

ALTER TABLE movimentacoes_carteira
    MODIFY COLUMN tipo_movimentacao ENUM('ADICAO', 'RESERVA', 'CREDITO', 'ESTORNO') NOT NULL;
