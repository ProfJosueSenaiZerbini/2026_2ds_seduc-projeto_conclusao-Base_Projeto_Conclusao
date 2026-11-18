-- Migração 003: endereço do bico verificado pelo CEP.
-- Para bancos db_bico já criados com um schema.sql anterior. Quem criar o banco do zero
-- com o schema.sql atual NÃO precisa executar este script.
--
-- Adiciona à tabela bicos as colunas do endereço (CEP, logradouro, número, complemento, cidade e UF).
-- Logradouro, bairro, cidade e UF são gravados a partir da consulta do CEP (ViaCEP/BrasilAPI),
-- não do que o contratante digita. O CEP é gravado só com os 8 dígitos (sem traço).
-- Todas as colunas novas aceitam NULL: os bicos publicados antes desta migração continuam válidos
-- e seguem exibindo apenas o bairro. A coluna bairro não muda.
--
-- Executar uma única vez, com o banco selecionado (USE db_bico).

USE db_bico;

ALTER TABLE bicos
    ADD COLUMN cep CHAR(8) DEFAULT NULL AFTER bairro,
    ADD COLUMN logradouro VARCHAR(150) DEFAULT NULL AFTER cep,
    ADD COLUMN numero VARCHAR(10) DEFAULT NULL AFTER logradouro,
    ADD COLUMN complemento VARCHAR(60) DEFAULT NULL AFTER numero,
    ADD COLUMN cidade VARCHAR(100) DEFAULT NULL AFTER complemento,
    ADD COLUMN uf CHAR(2) DEFAULT NULL AFTER cidade;
