CREATE DATABASE IF NOT EXISTS corujateca_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_0900_ai_ci;

CREATE USER IF NOT EXISTS 'corujateca_app'@'localhost'
IDENTIFIED BY '@SMERAb3h7t$@ht!';

GRANT
SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP, REFERENCES
ON corujateca_db.*
TO 'corujateca_app'@'localhost';

FLUSH PRIVILEGES;

USE corujateca_db;

CREATE TABLE IF NOT EXISTS frequentador (
	id_freq INT AUTO_INCREMENT PRIMARY KEY,
	nome_freq VARCHAR(255) NOT NULL,
	senha_freq VARCHAR(255) NOT NULL,
	inativo_freq BOOLEAN NOT NULL DEFAULT FALSE,
	suspensao_freq BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS bibliotecario (
	id_bibliotecario INT AUTO_INCREMENT PRIMARY KEY,
	nome_bibliotecario VARCHAR(255) NOT NULL,
	senha_bibliotecario VARCHAR(255) NOT NULL,
	inativo_bibliotecario BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS livro (
	id_livro INT AUTO_INCREMENT PRIMARY KEY,
	isbn VARCHAR(13) NOT NULL UNIQUE,
	titulo_livro VARCHAR(255) NOT NULL,
	autor_livro VARCHAR(255) NOT NULL,
	sinopse_livro TEXT NULL,
	editora_livro VARCHAR(255) NOT NULL,
	anoPub_livro SMALLINT NOT NULL,
	imgCapa_livro VARCHAR(130) NOT NULL,
	genero_livro VARCHAR(30) NOT NULL,
	inativo_livro BOOLEAN NOT NULL DEFAULT FALSE,
	localizacao_livro VARCHAR(130) NOT NULL
);

CREATE TABLE IF NOT EXISTS exemplar (
    id_exemplar INT AUTO_INCREMENT PRIMARY KEY,
    inativo_exemplar BOOLEAN NOT NULL DEFAULT FALSE,
    status_exemplar ENUM('Em posse', 'Disponível', 'Danificado') NOT NULL DEFAULT 'Disponível',
    FK_LIVRO_id_livro INT NOT NULL,
    CONSTRAINT fk_exp_id_livro
        FOREIGN KEY (FK_LIVRO_id_livro)
        REFERENCES livro (id_livro)
);

CREATE TABLE IF NOT EXISTS emprestimo (
	id_emprestimo INT AUTO_INCREMENT PRIMARY KEY,
	dta_emprestimo DATE NOT NULL,
	dta_devolucao DATE NOT NULL,
	dta_devolucao_real DATE DEFAULT NULL,
	inativo_emprestimo BOOLEAN NOT NULL DEFAULT FALSE,
	FK_BIBLIOTECARIO_id_bibliotecario INT NOT NULL,
	FK_EXEMPLAR_id_exemplar INT NOT NULL,
	FK_FREQUENTADOR_id_freq INT NOT NULL,

	CONSTRAINT fk_emp_bibliotecario
		FOREIGN KEY (FK_BIBLIOTECARIO_id_bibliotecario) 
		REFERENCES bibliotecario (id_bibliotecario),
	CONSTRAINT fk_emp_exemplar 
		FOREIGN KEY (FK_EXEMPLAR_id_exemplar) 
		REFERENCES exemplar (id_exemplar),
	CONSTRAINT fk_emp_frequentador 
		FOREIGN KEY (FK_FREQUENTADOR_id_freq) 
		REFERENCES frequentador (id_freq)
);

CREATE TABLE IF NOT EXISTS multa (
    id_multa INT AUTO_INCREMENT PRIMARY KEY,
    dta_inicio_multa DATE NOT NULL,
    dta_termino_multa DATE NOT NULL,
    inativo_multa BOOLEAN NOT NULL DEFAULT FALSE,
    tipoMulta VARCHAR(20) NOT NULL,
    FK_BIBLIOTECARIO_id_bibliotecario INT NOT NULL,
    FK_FREQUENTADOR_id_frequentador INT NOT NULL,

	CONSTRAINT fk_mlt_bibliotecario
		FOREIGN KEY (FK_BIBLIOTECARIO_id_bibliotecario) 
		REFERENCES bibliotecario (id_bibliotecario),
	CONSTRAINT fk_mlt_frequentador
		FOREIGN KEY (FK_FREQUENTADOR_id_frequentador) 
		REFERENCES frequentador (id_freq)
);

CREATE TABLE IF NOT EXISTS tel_bibliotecario (
    id_tel_bibliotecario INT AUTO_INCREMENT PRIMARY KEY,
    numTel_bibliotecario VARCHAR(9) NOT NULL,
    ddd_bibliotecario VARCHAR(2) NOT NULL,
    FK_BIBLIOTECARIO_id_bibliotecario INT NOT NULL,

	CONSTRAINT fk_tel_bibliotecario
		FOREIGN KEY (FK_BIBLIOTECARIO_id_bibliotecario) 
		REFERENCES bibliotecario (id_bibliotecario)
		ON DELETE CASCADE
		ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS tel_freq (
    id_tel_freq INT AUTO_INCREMENT PRIMARY KEY,
    ddd_freq VARCHAR(2) NOT NULL,
    numTel_freq VARCHAR(9) NOT NULL,
    FK_FREQUENTADOR_id_freq INT NOT NULL,

    CONSTRAINT fk_tel_frequentador 
        FOREIGN KEY (FK_FREQUENTADOR_id_freq) 
        REFERENCES frequentador (id_freq)
		ON DELETE CASCADE
		ON UPDATE CASCADE
);