INSERT INTO frequentador (nome_freq, senha_freq, inativo_freq, suspensao_freq) VALUES
('Ana Silva', 'hash_senha_123', FALSE, FALSE),
('Bruno Oliveira', 'hash_senha_456', FALSE, FALSE),
('Carla Souza', 'hash_senha_789', FALSE, TRUE),
('Willian santos', 'hash_senha_163', TRUE, FALSE),
('Beijamin Evan', 'hash_senha_796', TRUE, TRUE),
('Michael Souza', 'hash_senha_919', FALSE, TRUE);

-- 2. POVOANDO BIBLIOTECÁRIOS
INSERT INTO bibliotecario (nome_bibliotecario, senha_bibliotecario, inativo_bibliotecario) VALUES
('Mariana Costa', 'hash_admin_01', FALSE),
('Roberto Santos', 'hash_admin_02', FALSE),
('Gustavo Bauh', 'hash_admin_03', TRUE),
('Nathan Oliver', 'hash_admin_04', FALSE);

-- 3. POVOANDO TELEFONES DOS FREQUENTADORES
INSERT INTO tel_freq (ddd_freq, numTel_freq, FK_FREQUENTADOR_id_freq) VALUES
('11', '987654321', 1),
('21', '912345678', 2),
('31', '998877665', 3),
('12', '917652381', 4),
('43', '912345678', 5),
('32', '998877665', 6);

-- 4. POVOANDO TELEFONES DOS BIBLIOTECÁRIOS
INSERT INTO tel_bibliotecario (ddd_bibliotecario, numTel_bibliotecario, FK_BIBLIOTECARIO_id_bibliotecario) VALUES
('11', '977778888', 1),
('11', '966665555', 2),
('12', '973475801', 3),
('15', '914261355', 4);
-- 5. POVOANDO LIVROS
INSERT INTO livro (isbn, titulo_livro, autor_livro, sinopse_livro, editora_livro, anoPub_livro, imgCapa_livro, genero_livro, inativo_livro, localizacao_livro) VALUES
('9788535902777', 'Dom Casmurro', 'Machado de Assis', 'A história de Bentinho e Capitu.', 'Companhia das Letras', 1899, 'capas/dom_casmurro.jpg', 'Romance', FALSE, 'Estante A1'),
('9788576572008', 'Duna', 'Frank Herbert', 'A jornada de Paul Atreides em Arrakis.', 'Editora Aleph', 1965, 'capas/duna.jpg', 'Ficção Científica', FALSE, 'Estante B3'),
('9728535914848', '1984', 'George Orwell', 'Um futuro distópico sob vigilância constante.', 'Companhia das Letras', 1949, 'capas/1984.jpg', 'Distopia', FALSE, 'Estante B1'),
('9788535902677', 'Percy Jackson', 'Rick Riordan', 'a história de percy', 'Companhia das Letras', 1899, 'capas/RickRiordan.jpg', 'aventura', FALSE, 'Estante D9'),
('97885765892008', 'Fundação', 'Isaac Asimov', 'Um plano para salvar a humanidade', 'Editora Aleph', 1965, 'capas/fundacao.jpg', 'Ficção Científica', FALSE, 'Estante B6'),
('9188535914848', '1985', 'George Orwell', 'Um futuro Atópico sob vigilância constante.', 'Companhia das Letras', 1949, 'capas/1984.jpg', 'Distopia', FALSE, 'Estante Z1');

-- 6. POVOANDO EXEMPLARES
INSERT INTO exemplar (status_exemplar, inativo_exemplar, FK_LIVRO_id_livro) VALUES
('Disponível', FALSE, 1), -- Exemplar 1 de Dom Casmurro
('Em posse', FALSE, 1),   -- Exemplar 2 de Dom Casmurro (Empréstimo ativo)
('Disponível', FALSE, 2), -- Exemplar 1 de Duna
('Danificado', FALSE, 3), -- Exemplar 1 de 1984
('Disponível', FALSE, 3), -- Exemplar 1 de Dom Casmurro
('Em posse', FALSE, 2),   -- Exemplar 2 de Dom Casmurro (Empréstimo ativo)
('Disponível', FALSE, 1), -- Exemplar 1 de Duna
('Danificado', FALSE, 2);

-- 7. POVOANDO EMPRÉSTIMOS
INSERT INTO emprestimo (dta_emprestimo, dta_devolucao, dta_devolucao_real, inativo_emprestimo, FK_BIBLIOTECARIO_id_bibliotecario, FK_EXEMPLAR_id_exemplar, FK_FREQUENTADOR_id_freq) VALUES
('2026-08-01', '2026-08-15', NULL, FALSE, 1, 2, 2),        -- Bruno pegou o exemplar 2 de Dom Casmurro (Em andamento)
('2026-07-01', '2026-07-15', '2026-07-20', FALSE, 2, 1, 3), -- Carla devolveu com atraso o exemplar 1 (Gerou multa)
('2026-09-01', '2026-08-15', NULL, FALSE, 1, 2, 2),        -- Bruno pegou o exemplar 2 de Dom Casmurro (Em andamento)
('2026-10-01', '2026-07-15', '2026-07-20', FALSE, 2, 1, 3);

-- 8. POVOANDO MULTAS
INSERT INTO multa (dta_inicio_multa, dta_termino_multa, inativo_multa, tipoMulta, FK_BIBLIOTECARIO_id_bibliotecario, FK_FREQUENTADOR_id_frequentador) VALUES
('2026-07-20', '2026-07-27', FALSE, 'Atraso', 2, 3), -- Multa aplicada à Carla pelo atraso
('2026-07-20', '2026-07-27', FALSE, 'Atraso', 2, 3); -- Multa aplicada à Carla pelo atraso
